import { Inject, Injectable } from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import {
  createDatabaseClient,
  Prisma,
  type PrismaClient,
} from "@mecoflow/database";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import {
  calculateMaterialRequirementStatus,
  MATERIAL_REQUIREMENT_STATUS_MODEL_VERSION,
  type PurchaseOrderLineInput,
} from "./material-requirement-status.js";

@Injectable()
export class RequirementStatusRepository {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  projectStatus(projectId: string) {
    return this.database.$transaction(
      (transaction) => this.projectStatusInTransaction(transaction, projectId),
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  private async projectStatusInTransaction(
    database: Prisma.TransactionClient,
    projectId: string,
  ) {
    const requirements = await database.bomLine.findMany({
      include: {
        bomRevision: {
          include: {
            bom: {
              include: {
                workPackage: {
                  select: { code: true, id: true, name: true },
                },
              },
            },
          },
        },
        item: { select: { code: true, id: true, name: true } },
        unitOfMeasure: {
          select: {
            code: true,
            decimalPrecision: true,
            id: true,
            name: true,
            symbol: true,
          },
        },
      },
      where: {
        bomRevision: { bom: { projectId }, status: "RELEASED" },
      },
    });
    requirements.sort(
      (left, right) =>
        (left.bomRevision.bom.workPackage?.code ?? "").localeCompare(
          right.bomRevision.bom.workPackage?.code ?? "",
        ) ||
        left.bomRevision.bom.id.localeCompare(right.bomRevision.bom.id) ||
        left.lineNumber - right.lineNumber ||
        left.id.localeCompare(right.id),
    );
    const requirementIds = requirements.map(({ id }) => id);
    if (requirementIds.length === 0)
      return {
        data: [],
        modelVersion: MATERIAL_REQUIREMENT_STATUS_MODEL_VERSION,
      };

    const requisitionLines = await database.purchaseRequisitionLine.findMany({
      select: {
        bomLineId: true,
        purchaseRequisition: { select: { status: true } },
        quantity: true,
      },
      where: { bomLineId: { in: requirementIds } },
    });
    const touchingAllocations = await database.purchaseOrderAllocation.findMany(
      {
        select: { purchaseOrderLineId: true },
        where: {
          purchaseRequisitionLine: { bomLineId: { in: requirementIds } },
        },
      },
    );
    const materialAllocations = await database.materialAllocation.findMany({
      select: { bomLineId: true, quantity: true, status: true },
      where: { bomLineId: { in: requirementIds } },
    });

    const purchaseOrderLineIds = [
      ...new Set(
        touchingAllocations.map(
          ({ purchaseOrderLineId }) => purchaseOrderLineId,
        ),
      ),
    ];
    const purchaseOrderLines =
      purchaseOrderLineIds.length === 0
        ? []
        : await database.purchaseOrderLine.findMany({
            include: {
              allocations: {
                include: {
                  purchaseRequisitionLine: { select: { bomLineId: true } },
                },
              },
              commitmentLines: {
                include: {
                  supplierCommitmentRevision: {
                    select: { revisionNumber: true },
                  },
                },
              },
              purchaseOrderRevision: {
                include: {
                  purchaseOrder: { select: { status: true } },
                },
              },
              shipmentNoticeLines: {
                include: {
                  advanceShipmentNotice: { select: { status: true } },
                  inventoryLots: {
                    include: {
                      adjustments: {
                        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
                        select: { quantityDelta: true },
                      },
                      receivingInspection: {
                        select: {
                          checks: {
                            select: {
                              certificateDecision: true,
                              checkType: true,
                              completedAt: true,
                              conforming: true,
                              evidenceDocumentId: true,
                              required: true,
                            },
                          },
                        },
                      },
                    },
                    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
                  },
                },
              },
              unitOfMeasure: { select: { decimalPrecision: true } },
            },
            where: { id: { in: purchaseOrderLineIds } },
          });

    const calculation = calculateMaterialRequirementStatus({
      materialAllocations: materialAllocations.map((allocation) => ({
        bomLineId: allocation.bomLineId,
        quantity: allocation.quantity.toString(),
        status: allocation.status,
      })),
      purchaseOrderLines: purchaseOrderLines.map((line) => {
        const lots = line.shipmentNoticeLines.flatMap((shipmentLine) =>
          shipmentLine.inventoryLots.map((lot) => {
            const requiredCertificateChecks =
              lot.receivingInspection?.checks.filter(
                (check) => check.required && check.checkType === "CERTIFICATE",
              ) ?? [];
            const certificateComplete = requiredCertificateChecks.every(
              (check) =>
                check.certificateDecision === "ACCEPTED" &&
                check.completedAt !== null &&
                check.conforming === true &&
                check.evidenceDocumentId !== null,
            );
            return {
              acceptedQuantity: lot.acceptedQuantity.toString(),
              certificateCompleteQuantity: certificateComplete
                ? lot.acceptedQuantity.toString()
                : "0",
              correctionQuantityDeltas: lot.adjustments.map((adjustment) =>
                adjustment.quantityDelta.toString(),
              ),
              id: lot.id,
              originalQuantity: lot.quantity.toString(),
              quarantinedQuantity: lot.quarantinedQuantity.toString(),
              rejectedQuantity: lot.rejectedQuantity.toString(),
              sortKey: `${lot.createdAt.toISOString()}:${lot.id}`,
            };
          }),
        );
        return {
          allocations: line.allocations.map((allocation) => ({
            bomLineId: allocation.purchaseRequisitionLine.bomLineId,
            quantity: allocation.quantity.toString(),
            requiredDate: allocation.requiredDateSnapshot
              .toISOString()
              .slice(0, 10),
          })),
          commitments: line.commitmentLines.map((commitment) => ({
            committedDate: commitment.committedDate.toISOString().slice(0, 10),
            revisionNumber:
              commitment.supplierCommitmentRevision.revisionNumber,
          })),
          currentRevision: line.purchaseOrderRevision.current,
          decimalPrecision: line.unitOfMeasure.decimalPrecision,
          id: line.id,
          lots,
          orderStatus: line.purchaseOrderRevision.purchaseOrder.status,
          shipments: line.shipmentNoticeLines.map((shipmentLine) => ({
            quantity: shipmentLine.shippedQuantity.toString(),
            status: shipmentLine.advanceShipmentNotice.status,
          })),
        } satisfies PurchaseOrderLineInput;
      }),
      requisitions: requisitionLines.map((line) => ({
        bomLineId: line.bomLineId,
        quantity: line.quantity.toString(),
        status: line.purchaseRequisition.status,
      })),
      requirements: requirements.map((line) => ({
        bomLineId: line.id,
        decimalPrecision: line.unitOfMeasure.decimalPrecision,
        requiredQuantity: line.quantity.toString(),
      })),
    });
    const calculationByLine = new Map(
      calculation.map((line) => [line.bomLineId, line]),
    );

    return {
      data: requirements.map((line) => ({
        ...calculationByLine.get(line.id)!,
        bomId: line.bomRevision.bom.id,
        bomRevisionId: line.bomRevisionId,
        bomRevisionNumber: line.bomRevision.revisionNumber,
        criticality: line.criticality,
        item: line.item,
        lineNumber: line.lineNumber,
        unitOfMeasure: line.unitOfMeasure,
        workPackage: line.bomRevision.bom.workPackage,
      })),
      modelVersion: MATERIAL_REQUIREMENT_STATUS_MODEL_VERSION,
    };
  }
}

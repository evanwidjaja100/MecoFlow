import type { Prisma } from "@mecoflow/database";
import {
  calculateMaterialRequirementStatus,
  MATERIAL_REQUIREMENT_STATUS_MODEL_VERSION,
  type PurchaseOrderLineInput,
  type ReadinessLineInput,
} from "@mecoflow/readiness";

export interface ReadinessSourceLine extends ReadinessLineInput {
  confirmedQuantity: string;
  itemName: string;
  orderedQuantity: string;
  receivedQuantity: string;
  requisitionedQuantity: string;
  shippedQuantity: string;
  unitCode: string;
  unitSymbol: string;
  workPackageCode: string | null;
  workPackageName: string | null;
}

export interface ReadinessProjectSource {
  materialProjectionVersion: string;
  organizationId: string;
  projectCode: string;
  projectId: string;
  projectName: string;
  lines: ReadinessSourceLine[];
  unresolvedProjectNcrCount: number;
}

export class ReadinessInputRepository {
  async load(
    database: Prisma.TransactionClient,
    projectId: string,
  ): Promise<ReadinessProjectSource | null> {
    const project = await database.project.findUnique({
      select: {
        code: true,
        id: true,
        name: true,
        organizationId: true,
        plannedStartDate: true,
      },
      where: { id: projectId },
    });
    if (!project) return null;

    const requirements = await database.bomLine.findMany({
      include: {
        bomRevision: {
          include: {
            bom: {
              include: {
                workPackage: {
                  select: {
                    code: true,
                    id: true,
                    name: true,
                    plannedStartDate: true,
                  },
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
    const itemIds = [...new Set(requirements.map(({ itemId }) => itemId))];

    const requisitionLines =
      requirementIds.length === 0
        ? []
        : await database.purchaseRequisitionLine.findMany({
            select: {
              bomLineId: true,
              purchaseRequisition: { select: { status: true } },
              quantity: true,
            },
            where: { bomLineId: { in: requirementIds } },
          });
    const touchingAllocations =
      requirementIds.length === 0
        ? []
        : await database.purchaseOrderAllocation.findMany({
            select: { purchaseOrderLineId: true },
            where: {
              purchaseRequisitionLine: { bomLineId: { in: requirementIds } },
            },
          });
    const materialAllocations =
      requirementIds.length === 0
        ? []
        : await database.materialAllocation.findMany({
            select: { bomLineId: true, quantity: true, status: true },
            where: { bomLineId: { in: requirementIds } },
          });
    const certificateDefinitions =
      itemIds.length === 0
        ? []
        : await database.inspectionCheckDefinition.findMany({
            select: { itemId: true },
            where: {
              active: true,
              checkType: "CERTIFICATE",
              itemId: { in: itemIds },
              required: true,
            },
          });
    const certificateRequiredItems = new Set(
      certificateDefinitions.map(({ itemId }) => itemId),
    );

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

    const mappedPurchaseOrderLines = purchaseOrderLines.map((line) => {
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
          revisionNumber: commitment.supplierCommitmentRevision.revisionNumber,
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
    });

    const materialStatus = calculateMaterialRequirementStatus({
      materialAllocations: materialAllocations.map((allocation) => ({
        bomLineId: allocation.bomLineId,
        quantity: allocation.quantity.toString(),
        status: allocation.status,
      })),
      purchaseOrderLines: mappedPurchaseOrderLines,
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
    const statusByLine = new Map(
      materialStatus.map((status) => [status.bomLineId, status]),
    );

    const activeNcrs = await database.ncr.findMany({
      include: {
        inventoryLot: {
          select: {
            advanceShipmentNoticeLine: {
              select: {
                purchaseOrderLine: {
                  select: {
                    allocations: {
                      select: {
                        purchaseRequisitionLine: {
                          select: { bomLineId: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        receivingInspection: {
          select: {
            inventoryLot: {
              select: {
                advanceShipmentNoticeLine: {
                  select: {
                    purchaseOrderLine: {
                      select: {
                        allocations: {
                          select: {
                            purchaseRequisitionLine: {
                              select: { bomLineId: true },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      where: {
        projectId,
        status: { in: ["ISSUED", "SUPPLIER_RESPONDED"] },
      },
    });
    const activeNcrCountByLine = new Map<string, number>();
    let unresolvedProjectNcrCount = 0;
    for (const ncr of activeNcrs) {
      if (ncr.sourceType === "PROJECT") {
        unresolvedProjectNcrCount += 1;
        continue;
      }
      const lot = ncr.inventoryLot ?? ncr.receivingInspection?.inventoryLot;
      const bomLineIds = new Set(
        lot?.advanceShipmentNoticeLine.purchaseOrderLine.allocations.map(
          (allocation) => allocation.purchaseRequisitionLine.bomLineId,
        ) ?? [],
      );
      for (const bomLineId of bomLineIds) {
        if (!requirementIds.includes(bomLineId)) continue;
        activeNcrCountByLine.set(
          bomLineId,
          (activeNcrCountByLine.get(bomLineId) ?? 0) + 1,
        );
      }
    }

    return {
      lines: requirements.map((line) => {
        const status = statusByLine.get(line.id)!;
        const workPackage = line.bomRevision.bom.workPackage;
        return {
          ...status,
          certificateRequired: certificateRequiredItems.has(line.itemId),
          criticality: line.criticality,
          itemCode: line.item.code,
          itemName: line.item.name,
          lineNumber: line.lineNumber,
          openNcrCount: activeNcrCountByLine.get(line.id) ?? 0,
          requiredDate: (
            workPackage?.plannedStartDate ?? project.plannedStartDate
          )
            .toISOString()
            .slice(0, 10),
          unitCode: line.unitOfMeasure.code,
          unitSymbol: line.unitOfMeasure.symbol,
          workPackageCode: workPackage?.code ?? null,
          workPackageId: workPackage?.id ?? null,
          workPackageName: workPackage?.name ?? null,
        };
      }),
      materialProjectionVersion: MATERIAL_REQUIREMENT_STATUS_MODEL_VERSION,
      organizationId: project.organizationId,
      projectCode: project.code,
      projectId: project.id,
      projectName: project.name,
      unresolvedProjectNcrCount,
    };
  }
}

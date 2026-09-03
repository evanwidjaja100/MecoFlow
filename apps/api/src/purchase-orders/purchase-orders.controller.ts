import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { requestContext } from "../request-context.js";
import {
  CreatePurchaseOrderDto,
  CreateSupplierCommitmentDto,
  PurchaseOrderCommandDto,
  PurchaseOrderListQueryDto,
  RevisePurchaseOrderDto,
} from "./purchase-orders.dto.js";
import { PurchaseOrdersService } from "./purchase-orders.service.js";

@ApiTags("Purchase orders and supplier commitments")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The principal lacks operation or object scope",
})
@Controller("api/v1")
export class PurchaseOrdersController {
  constructor(
    @Inject(PurchaseOrdersService)
    private readonly purchaseOrders: PurchaseOrdersService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("projects/:projectId/purchase-order-requirements")
  @ApiOperation({
    summary: "List approved requisition quantity available to order",
  })
  async requirements(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.purchaseOrders.requirements(principal, projectId);
  }

  @Get("projects/:projectId/purchase-orders")
  @ApiOperation({ summary: "List internal project purchase orders" })
  async list(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Query() query: PurchaseOrderListQueryDto,
  ) {
    const principal = await this.identity.principal(request);
    return this.purchaseOrders.list(principal, projectId, query.status);
  }

  @Post("projects/:projectId/purchase-orders")
  @ApiOperation({
    summary: "Create a draft purchase order from approved requisition lines",
  })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async create(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: CreatePurchaseOrderDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.purchaseOrders.create(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Get("purchase-orders/:purchaseOrderId")
  @ApiOperation({
    summary: "Read internal purchase order revision and commitment history",
  })
  async detail(
    @Req() request: Request,
    @Param("purchaseOrderId", new ParseUUIDPipe()) purchaseOrderId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.purchaseOrders.detail(principal, purchaseOrderId);
  }

  @Post("purchase-orders/:purchaseOrderId/revise")
  @ApiOperation({
    summary: "Append and activate a retained purchase order revision",
  })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async revise(
    @Req() request: Request,
    @Param("purchaseOrderId", new ParseUUIDPipe()) purchaseOrderId: string,
    @Body() input: RevisePurchaseOrderDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.purchaseOrders.revise(
      principal,
      requestContext(request),
      purchaseOrderId,
      input,
    );
  }

  private async internalCommand(
    request: Request,
    purchaseOrderId: string,
    input: PurchaseOrderCommandDto,
    kind: "cancel" | "send",
  ) {
    const principal = await this.identity.principal(request, true);
    return this.purchaseOrders[kind](
      principal,
      requestContext(request),
      purchaseOrderId,
      input,
    );
  }

  @Post("purchase-orders/:purchaseOrderId/send")
  @ApiOperation({ summary: "Send the current purchase order revision" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  send(
    @Req() request: Request,
    @Param("purchaseOrderId", new ParseUUIDPipe()) purchaseOrderId: string,
    @Body() input: PurchaseOrderCommandDto,
  ) {
    return this.internalCommand(request, purchaseOrderId, input, "send");
  }

  @Post("purchase-orders/:purchaseOrderId/cancel")
  @ApiOperation({ summary: "Cancel an active purchase order" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  cancel(
    @Req() request: Request,
    @Param("purchaseOrderId", new ParseUUIDPipe()) purchaseOrderId: string,
    @Body() input: PurchaseOrderCommandDto,
  ) {
    return this.internalCommand(request, purchaseOrderId, input, "cancel");
  }

  @Get("projects/:projectId/purchase-order-exceptions")
  @ApiOperation({ summary: "List latest commitments after BOM-required dates" })
  async exceptions(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.purchaseOrders.exceptions(principal, projectId);
  }

  @Get("supplier/purchase-orders")
  @ApiOperation({
    summary: "List supplier-visible own-organization purchase orders",
  })
  async supplierList(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    return this.purchaseOrders.supplierList(principal, requestContext(request));
  }

  @Get("supplier/purchase-orders/:purchaseOrderId")
  @ApiOperation({
    summary: "Read field-filtered own-organization purchase order detail",
  })
  async supplierDetail(
    @Req() request: Request,
    @Param("purchaseOrderId", new ParseUUIDPipe()) purchaseOrderId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.purchaseOrders.supplierDetail(
      principal,
      requestContext(request),
      purchaseOrderId,
    );
  }

  @Post("supplier/purchase-orders/:purchaseOrderId/acknowledge")
  @ApiOperation({
    summary: "Acknowledge the current own-organization purchase order revision",
  })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async acknowledge(
    @Req() request: Request,
    @Param("purchaseOrderId", new ParseUUIDPipe()) purchaseOrderId: string,
    @Body() input: PurchaseOrderCommandDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.purchaseOrders.acknowledge(
      principal,
      requestContext(request),
      purchaseOrderId,
      input,
    );
  }

  @Post("supplier/purchase-orders/:purchaseOrderId/commitments")
  @ApiOperation({ summary: "Append a supplier commitment revision" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async commitment(
    @Req() request: Request,
    @Param("purchaseOrderId", new ParseUUIDPipe()) purchaseOrderId: string,
    @Body() input: CreateSupplierCommitmentDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.purchaseOrders.appendCommitment(
      principal,
      requestContext(request),
      purchaseOrderId,
      input,
    );
  }
}

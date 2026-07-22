import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
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
  CreateAdvanceShipmentNoticeDto,
  CreateGoodsReceiptCorrectionDto,
  CreateGoodsReceiptDto,
  PostGoodsReceiptDto,
  ShipmentCommandDto,
} from "./receiving.dto.js";
import { ReceivingService } from "./receiving.service.js";

@ApiTags("Advance shipment notices and receiving")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The principal lacks operation or object scope",
})
@Controller("api/v1")
export class ReceivingController {
  constructor(
    @Inject(ReceivingService)
    private readonly receiving: ReceivingService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("supplier/asns")
  @ApiOperation({ summary: "List own-organization advance shipment notices" })
  async supplierList(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    return this.receiving.supplierList(principal);
  }

  @Post("supplier/purchase-orders/:purchaseOrderId/asns")
  @ApiOperation({ summary: "Create a draft ASN from supplier-owned PO lines" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createAsn(
    @Req() request: Request,
    @Param("purchaseOrderId", new ParseUUIDPipe()) purchaseOrderId: string,
    @Body() input: CreateAdvanceShipmentNoticeDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.receiving.createAsn(
      principal,
      requestContext(request),
      purchaseOrderId,
      input,
    );
  }

  @Get("supplier/asns/:asnId")
  @ApiOperation({ summary: "Read an own-organization ASN" })
  async supplierDetail(
    @Req() request: Request,
    @Param("asnId", new ParseUUIDPipe()) asnId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.receiving.supplierDetail(principal, asnId);
  }

  private async supplierCommand(
    request: Request,
    asnId: string,
    input: ShipmentCommandDto,
    kind: "cancelAsn" | "dispatchAsn" | "submitAsn",
  ) {
    const principal = await this.identity.principal(request, true);
    return this.receiving[kind](
      principal,
      requestContext(request),
      asnId,
      input,
    );
  }

  @Post("supplier/asns/:asnId/submit")
  @ApiOperation({ summary: "Submit a draft ASN" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  submitAsn(
    @Req() request: Request,
    @Param("asnId", new ParseUUIDPipe()) asnId: string,
    @Body() input: ShipmentCommandDto,
  ) {
    return this.supplierCommand(request, asnId, input, "submitAsn");
  }

  @Post("supplier/asns/:asnId/dispatch")
  @ApiOperation({ summary: "Mark a submitted ASN in transit" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  dispatchAsn(
    @Req() request: Request,
    @Param("asnId", new ParseUUIDPipe()) asnId: string,
    @Body() input: ShipmentCommandDto,
  ) {
    return this.supplierCommand(request, asnId, input, "dispatchAsn");
  }

  @Post("supplier/asns/:asnId/cancel")
  @ApiOperation({ summary: "Cancel a draft or submitted ASN" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  cancelAsn(
    @Req() request: Request,
    @Param("asnId", new ParseUUIDPipe()) asnId: string,
    @Body() input: ShipmentCommandDto,
  ) {
    return this.supplierCommand(request, asnId, input, "cancelAsn");
  }

  @Get("projects/:projectId/asns")
  @ApiOperation({ summary: "List internal project ASNs" })
  async listAsns(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.receiving.listAsns(principal, projectId);
  }

  @Get("asns/:asnId")
  @ApiOperation({ summary: "Read an internal ASN" })
  async asnDetail(
    @Req() request: Request,
    @Param("asnId", new ParseUUIDPipe()) asnId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.receiving.asnDetail(principal, asnId);
  }

  @Post("asns/:asnId/arrive")
  @ApiOperation({ summary: "Record arrival of an in-transit ASN" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async arriveAsn(
    @Req() request: Request,
    @Param("asnId", new ParseUUIDPipe()) asnId: string,
    @Body() input: ShipmentCommandDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.receiving.arriveAsn(
      principal,
      requestContext(request),
      asnId,
      input,
    );
  }

  @Get("projects/:projectId/goods-receipts")
  @ApiOperation({ summary: "List project goods receipts" })
  async listReceipts(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.receiving.listReceipts(principal, projectId);
  }

  @Post("projects/:projectId/goods-receipts")
  @ApiOperation({ summary: "Create a draft goods receipt for an arrived ASN" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createReceipt(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: CreateGoodsReceiptDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.receiving.createReceipt(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Get("goods-receipts/:receiptId")
  @ApiOperation({
    summary: "Read a goods receipt and awaiting-inspection lots",
  })
  async receiptDetail(
    @Req() request: Request,
    @Param("receiptId", new ParseUUIDPipe()) receiptId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.receiving.receiptDetail(principal, receiptId);
  }

  @Post("goods-receipts/:receiptId/corrections")
  @ApiOperation({ summary: "Create a separate draft correcting receipt" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createCorrection(
    @Req() request: Request,
    @Param("receiptId", new ParseUUIDPipe()) receiptId: string,
    @Body() input: CreateGoodsReceiptCorrectionDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.receiving.createCorrection(
      principal,
      requestContext(request),
      receiptId,
      input,
    );
  }

  @Post("goods-receipts/:receiptId/post")
  @ApiOperation({
    summary: "Idempotently post a receipt and inventory effects",
  })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  @ApiHeader({ name: "Idempotency-Key", required: true })
  async postReceipt(
    @Req() request: Request,
    @Param("receiptId", new ParseUUIDPipe()) receiptId: string,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() input: PostGoodsReceiptDto,
  ) {
    if (!idempotencyKey || !/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey))
      throw new BadRequestException(
        "Idempotency-Key must be 8-128 safe characters",
      );
    const principal = await this.identity.principal(request, true);
    return this.receiving.postReceipt(
      principal,
      requestContext(request),
      receiptId,
      input,
      idempotencyKey,
    );
  }
}

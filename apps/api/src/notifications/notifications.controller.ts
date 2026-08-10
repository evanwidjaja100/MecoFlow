import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { requestContext } from "../request-context.js";
import {
  ListNotificationsQueryDto,
  NotificationListResponseDto,
  NotificationPreferencesResponseDto,
  notificationTypes,
  type NotificationType,
  UpdateNotificationPreferenceDto,
} from "./notifications.dto.js";
import { NotificationsService } from "./notifications.service.js";

@ApiTags("Notifications")
@ApiCookieAuth("session")
@Controller("api/v1")
export class NotificationsController {
  constructor(
    @Inject(NotificationsService)
    private readonly notifications: NotificationsService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("notifications")
  @ApiOperation({ summary: "List the current user's authorized notifications" })
  @ApiOkResponse({ type: NotificationListResponseDto })
  async list(
    @Req() request: Request,
    @Query() query: ListNotificationsQueryDto,
  ) {
    const result = await this.notifications.list(
      await this.identity.principal(request),
      query,
    );
    const page = Number(query.page ?? "1");
    const pageSize = Number(query.pageSize ?? "20");
    return {
      data: result.data,
      meta: { ...requestContext(request), unread: result.unread },
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    };
  }

  @Post("notifications/:notificationId/read")
  @ApiOperation({ summary: "Mark one own authorized notification as read" })
  @ApiParam({ format: "uuid", name: "notificationId" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async markRead(
    @Req() request: Request,
    @Param("notificationId", new ParseUUIDPipe()) notificationId: string,
  ) {
    return this.notifications.markRead(
      await this.identity.principal(request, true),
      notificationId,
    );
  }

  @Get("notification-preferences")
  @ApiOperation({ summary: "List the current user's notification preferences" })
  @ApiOkResponse({ type: NotificationPreferencesResponseDto })
  async preferences(@Req() request: Request) {
    return {
      data: await this.notifications.preferences(
        await this.identity.principal(request),
      ),
      meta: requestContext(request),
    };
  }

  @Put("notification-preferences/:type")
  @ApiOperation({ summary: "Update one own notification preference" })
  @ApiParam({ enum: notificationTypes, name: "type" })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updatePreference(
    @Req() request: Request,
    @Param("type") type: string,
    @Body() input: UpdateNotificationPreferenceDto,
  ) {
    if (!(type in notificationTypes))
      throw new BadRequestException("Invalid notification type");
    return this.notifications.updatePreference(
      await this.identity.principal(request, true),
      requestContext(request),
      type as NotificationType,
      input,
    );
  }
}

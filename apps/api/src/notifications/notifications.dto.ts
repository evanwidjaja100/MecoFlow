import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Matches,
  Min,
} from "class-validator";

export const notificationTypes = {
  READINESS_ALERT: "READINESS_ALERT",
  READINESS_REMINDER: "READINESS_REMINDER",
} as const;

export type NotificationType =
  (typeof notificationTypes)[keyof typeof notificationTypes];

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ example: "1", type: String })
  @IsOptional()
  @Matches(/^\d{1,6}$/)
  page?: string;

  @ApiPropertyOptional({ example: "20", type: String })
  @IsOptional()
  @Matches(/^\d{1,3}$/)
  pageSize?: string;

  @ApiPropertyOptional({ enum: ["true", "false"], type: String })
  @IsOptional()
  @IsIn(["false", "true"])
  unreadOnly?: "false" | "true";
}

export class UpdateNotificationPreferenceDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  inAppEnabled!: boolean;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  emailEnabled!: boolean;

  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class NotificationPreferenceDto {
  @ApiProperty({ enum: notificationTypes, type: String })
  type!: NotificationType;

  @ApiProperty({ type: Boolean })
  inAppEnabled!: boolean;

  @ApiProperty({ type: Boolean })
  emailEnabled!: boolean;

  @ApiProperty({ minimum: 1, type: Number })
  version!: number;
}

export class NotificationDto {
  @ApiProperty({ format: "uuid", type: String })
  id!: string;

  @ApiProperty({ enum: notificationTypes, type: String })
  type!: NotificationType;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ type: String })
  message!: string;

  @ApiProperty({ type: String })
  actionUrl!: string;

  @ApiProperty({ format: "uuid", type: String })
  projectId!: string;

  @ApiProperty({ format: "date-time", nullable: true, type: String })
  readAt!: string | null;

  @ApiProperty({ format: "date-time", type: String })
  createdAt!: string;
}

class NotificationListMetaDto {
  @ApiProperty({ type: String })
  requestId!: string;

  @ApiProperty({ type: String })
  correlationId!: string;

  @ApiProperty({ minimum: 0, type: Number })
  unread!: number;
}

class NotificationPaginationDto {
  @ApiProperty({ minimum: 1, type: Number })
  page!: number;

  @ApiProperty({ maximum: 100, minimum: 1, type: Number })
  pageSize!: number;

  @ApiProperty({ minimum: 0, type: Number })
  total!: number;

  @ApiProperty({ minimum: 0, type: Number })
  totalPages!: number;
}

export class NotificationListResponseDto {
  @ApiProperty({ isArray: true, type: () => NotificationDto })
  data!: NotificationDto[];

  @ApiProperty({ type: () => NotificationListMetaDto })
  meta!: NotificationListMetaDto;

  @ApiProperty({ type: () => NotificationPaginationDto })
  pagination!: NotificationPaginationDto;
}

class NotificationResponseMetaDto {
  @ApiProperty({ type: String })
  requestId!: string;

  @ApiProperty({ type: String })
  correlationId!: string;
}

export class NotificationPreferencesResponseDto {
  @ApiProperty({ isArray: true, type: () => NotificationPreferenceDto })
  data!: NotificationPreferenceDto[];

  @ApiProperty({ type: () => NotificationResponseMetaDto })
  meta!: NotificationResponseMetaDto;
}

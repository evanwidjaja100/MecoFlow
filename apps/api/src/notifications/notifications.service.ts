import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";
import type { NotificationType } from "./notifications.dto.js";
import { NotificationsRepository } from "./notifications.repository.js";

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NotificationsRepository)
    private readonly repository: NotificationsRepository,
  ) {}

  list(
    principal: AuthenticatedPrincipal,
    input: { page?: string; pageSize?: string; unreadOnly?: "false" | "true" },
  ) {
    const page = Number(input.page ?? "1");
    const pageSize = Number(input.pageSize ?? "20");
    if (page < 1 || pageSize < 1 || pageSize > 100)
      throw new UnprocessableEntityException("Invalid pagination");
    return this.repository.list(principal, {
      page,
      pageSize,
      unreadOnly: input.unreadOnly === "true",
    });
  }

  markRead(principal: AuthenticatedPrincipal, notificationId: string) {
    return this.repository.markRead(principal, notificationId);
  }

  preferences(principal: AuthenticatedPrincipal) {
    return this.repository.preferences(principal.user.id);
  }

  updatePreference(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    type: NotificationType,
    input: {
      emailEnabled: boolean;
      expectedVersion: number;
      inAppEnabled: boolean;
    },
  ) {
    return this.repository.updatePreference({
      ...input,
      actorUserId: principal.user.id,
      context,
      organizationId: principal.memberships[0]?.organization.id ?? null,
      type,
    });
  }
}

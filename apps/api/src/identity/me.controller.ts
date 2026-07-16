import { Controller, Get, Inject, Req } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "./identity.service.js";

@ApiTags("identity")
@ApiCookieAuth("session")
@Controller("api/v1")
export class MeController {
  constructor(
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("me")
  @ApiOperation({ summary: "Return the active user and authorization context" })
  @ApiOkResponse({
    description: "Active profile, memberships, roles, and permissions",
  })
  @ApiUnauthorizedResponse({ description: "No valid server-side session" })
  async me(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    const internal = principal.memberships.some(
      (membership) => membership.organization.type === "INTERNAL",
    );
    return {
      memberships: principal.memberships.map((membership) => ({
        id: membership.id,
        organization: membership.organization,
        permissions: [...membership.permissions].sort(),
        roles: membership.roles,
      })),
      shell: internal ? "INTERNAL" : "SUPPLIER",
      user: principal.user,
    };
  }
}

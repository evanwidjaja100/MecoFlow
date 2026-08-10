import {
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Redirect,
  Req,
  Res,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import { IdentityService } from "./identity.service.js";

@ApiTags("authentication")
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller("api/v1/auth")
export class AuthController {
  constructor(
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("login")
  @Redirect()
  @ApiOperation({ summary: "Begin OIDC authorization code flow with PKCE" })
  @ApiQuery({ name: "returnTo", required: false })
  async login(
    @Query("returnTo") returnTo: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    return { url: await this.identity.beginLogin(returnTo, response) };
  }

  @Get("callback")
  @Redirect()
  @ApiOperation({ summary: "Complete the OIDC authorization callback" })
  @ApiQuery({ name: "code", required: true, type: String })
  @ApiQuery({ name: "state", required: true, type: String })
  async callback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!code || !state)
      return {
        url: this.identity.webUrl("/login?error=authentication_failed"),
      };
    try {
      const returnTo = await this.identity.completeLogin(
        code,
        state,
        request,
        response,
      );
      return { url: this.identity.webUrl(returnTo) };
    } catch {
      return {
        url: this.identity.webUrl("/login?error=authentication_failed"),
      };
    }
  }

  @Post("logout")
  @ApiCookieAuth("session")
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  @ApiOperation({ summary: "Revoke the current server-side session" })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.identity.logout(request, response);
    return { loggedOut: true };
  }
}

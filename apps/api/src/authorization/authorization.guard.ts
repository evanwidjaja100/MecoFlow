import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest() as Request & {
      principal?: AuthenticatedPrincipal;
      requestContext?: RequestContext;
      authorizationContext?: unknown;
    };
    if (!request.principal) {
      return false;
    }
    return true;
  }
}

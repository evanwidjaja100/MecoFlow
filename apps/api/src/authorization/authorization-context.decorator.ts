import { createParamDecorator } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type {
  AuthorizationContext,
  AuthorizationContextSet,
} from "./authorization-context.js";

export const AuthContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthorizationContext => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const request = ctx.switchToHttp().getRequest() as {
      authorizationContext?: AuthorizationContext;
    };
    if (!request.authorizationContext) {
      throw new Error(
        "AuthorizationContext not found on request. Ensure AuthorizationGuard is applied.",
      );
    }
    return request.authorizationContext;
  },
);

export const AuthContextSet = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthorizationContextSet => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const request = ctx.switchToHttp().getRequest() as {
      authorizationContextSet?: AuthorizationContextSet;
    };
    if (!request.authorizationContextSet) {
      throw new Error("AuthorizationContextSet not found on request.");
    }
    return request.authorizationContextSet;
  },
);

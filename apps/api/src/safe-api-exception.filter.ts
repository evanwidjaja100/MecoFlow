import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Request, Response } from "express";

const errors: Record<number, { code: string; message: string }> = {
  [HttpStatus.BAD_REQUEST]: {
    code: "VALIDATION_FAILED",
    message: "The request is invalid",
  },
  [HttpStatus.UNAUTHORIZED]: {
    code: "AUTHENTICATION_REQUIRED",
    message: "Authentication required",
  },
  [HttpStatus.FORBIDDEN]: { code: "ACCESS_DENIED", message: "Access denied" },
  [HttpStatus.NOT_FOUND]: {
    code: "RESOURCE_NOT_FOUND",
    message: "Resource not found",
  },
  [HttpStatus.CONFLICT]: {
    code: "CONCURRENT_MODIFICATION",
    message: "The resource changed; reload and try again",
  },
  [HttpStatus.UNPROCESSABLE_ENTITY]: {
    code: "VALIDATION_FAILED",
    message: "The request is invalid",
  },
  [HttpStatus.BAD_GATEWAY]: {
    code: "IDENTITY_PROVIDER_UNAVAILABLE",
    message: "Identity provider is unavailable",
  },
  [HttpStatus.PAYLOAD_TOO_LARGE]: {
    code: "REQUEST_TOO_LARGE",
    message: "The request body exceeds the allowed size",
  },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests",
  },
};

function statusFor(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus();
  if (
    typeof exception === "object" &&
    exception !== null &&
    "status" in exception &&
    exception.status === HttpStatus.PAYLOAD_TOO_LARGE &&
    "type" in exception &&
    exception.type === "entity.too.large"
  )
    return HttpStatus.PAYLOAD_TOO_LARGE;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

@Catch()
export class SafeApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    if (!request.path.startsWith("/api/v1")) {
      const status = statusFor(exception);
      response
        .status(status)
        .json(
          exception instanceof HttpException
            ? exception.getResponse()
            : { message: "Internal server error" },
        );
      return;
    }
    const status = statusFor(exception);
    const safe = errors[status] ?? {
      code: "INTERNAL_ERROR",
      message: "The request could not be completed",
    };
    const requestId =
      typeof response.locals.requestId === "string"
        ? response.locals.requestId
        : "unknown";
    response.status(status).json({ error: safe, requestId });
  }
}

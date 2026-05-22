import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RequestWithContext } from "../types/request-context";

export const Audit = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithContext>();
    return request.auditContext ?? { ip: "0.0.0.0", updatedBy: "system" };
  }
);

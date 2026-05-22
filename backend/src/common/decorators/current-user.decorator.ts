import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RequestWithContext } from "../types/request-context";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithContext>();
    return request.user;
  }
);

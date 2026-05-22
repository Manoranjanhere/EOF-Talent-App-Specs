import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { Observable } from "rxjs";
import { RequestWithContext } from "../types/request-context";

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const socketIp = request?.["socket"]?.remoteAddress;
    const ip = (request?.["ip"] ?? socketIp ?? "0.0.0.0").toString();
    const updatedBy = request.user?.userId ?? "system";
    request.auditContext = { ip, updatedBy };
    return next.handle();
  }
}

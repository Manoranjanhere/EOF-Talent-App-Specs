export interface AuthUser {
  userId: string;
  roles: number[];
}

export interface AuditContext {
  ip: string;
  updatedBy: string;
}

export interface RequestWithContext {
  user?: AuthUser;
  auditContext?: AuditContext;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
}

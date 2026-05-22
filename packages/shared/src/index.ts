export enum GroupId {
  Talent = 1,
  TalentEmployerOrAgency = 2,
  Admin = 5,
  TeamAdmin = 7,
  SuperAdmin = 10
}

export enum PurchaseType {
  Paid = "PAID",
  Free = "FREE",
  Compensatory = "COMPENSATORY"
}

export enum UserFlagReason {
  FinancialScam = "FINANCIAL_SCAM",
  Obscene = "OBSCENE",
  ChildAbuse = "CHILD_ABUSE",
  Pornography = "PORNOGRAPHY"
}

export enum AlbumVisibility {
  Public = "PUBLIC",
  Private = "PRIVATE"
}

export interface AuditStamped {
  lastUpdateAt: string;
  lastUpdateIp: string;
  lastUpdateBy: string;
}

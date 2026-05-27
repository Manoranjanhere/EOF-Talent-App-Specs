export declare enum GroupId {
    Talent = 1,
    TalentEmployerOrAgency = 2,
    Admin = 5,
    TeamAdmin = 7,
    SuperAdmin = 10
}
export declare enum PurchaseType {
    Paid = "PAID",
    Free = "FREE",
    Compensatory = "COMPENSATORY"
}
export declare enum UserFlagReason {
    FinancialScam = "FINANCIAL_SCAM",
    Obscene = "OBSCENE",
    ChildAbuse = "CHILD_ABUSE",
    Pornography = "PORNOGRAPHY"
}
export declare enum AlbumVisibility {
    Public = "PUBLIC",
    Private = "PRIVATE"
}
export interface AuditStamped {
    lastUpdateAt: string;
    lastUpdateIp: string;
    lastUpdateBy: string;
}

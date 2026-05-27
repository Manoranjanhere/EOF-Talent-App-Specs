"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlbumVisibility = exports.UserFlagReason = exports.PurchaseType = exports.GroupId = void 0;
var GroupId;
(function (GroupId) {
    GroupId[GroupId["Talent"] = 1] = "Talent";
    GroupId[GroupId["TalentEmployerOrAgency"] = 2] = "TalentEmployerOrAgency";
    GroupId[GroupId["Admin"] = 5] = "Admin";
    GroupId[GroupId["TeamAdmin"] = 7] = "TeamAdmin";
    GroupId[GroupId["SuperAdmin"] = 10] = "SuperAdmin";
})(GroupId || (exports.GroupId = GroupId = {}));
var PurchaseType;
(function (PurchaseType) {
    PurchaseType["Paid"] = "PAID";
    PurchaseType["Free"] = "FREE";
    PurchaseType["Compensatory"] = "COMPENSATORY";
})(PurchaseType || (exports.PurchaseType = PurchaseType = {}));
var UserFlagReason;
(function (UserFlagReason) {
    UserFlagReason["FinancialScam"] = "FINANCIAL_SCAM";
    UserFlagReason["Obscene"] = "OBSCENE";
    UserFlagReason["ChildAbuse"] = "CHILD_ABUSE";
    UserFlagReason["Pornography"] = "PORNOGRAPHY";
})(UserFlagReason || (exports.UserFlagReason = UserFlagReason = {}));
var AlbumVisibility;
(function (AlbumVisibility) {
    AlbumVisibility["Public"] = "PUBLIC";
    AlbumVisibility["Private"] = "PRIVATE";
})(AlbumVisibility || (exports.AlbumVisibility = AlbumVisibility = {}));
//# sourceMappingURL=index.js.map
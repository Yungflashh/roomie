"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.PaymentStatus = exports.RoommateStatus = exports.VerificationStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["ADMIN"] = "admin";
    UserRole["MODERATOR"] = "moderator";
})(UserRole || (exports.UserRole = UserRole = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["VERIFIED"] = "verified";
    VerificationStatus["REJECTED"] = "rejected";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var RoommateStatus;
(function (RoommateStatus) {
    RoommateStatus["SEARCHING"] = "searching";
    RoommateStatus["MATCHED"] = "matched";
    RoommateStatus["INACTIVE"] = "inactive";
})(RoommateStatus || (exports.RoommateStatus = RoommateStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["MATCH"] = "match";
    NotificationType["MESSAGE"] = "message";
    NotificationType["GAME_INVITE"] = "game_invite";
    NotificationType["PAYMENT"] = "payment";
    NotificationType["SYSTEM"] = "system";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
//# sourceMappingURL=index.js.map
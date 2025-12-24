// ==================== Payment Constants ====================
// Server-only Projections (shared constants import from @etuitionbd/shared/payments)

export const PAYMENT_LIST_PROJECTION = {
    _id: 1,
    applicationId: 1,
    tuitionId: 1,
    amount: 1,
    platformFee: 1,
    tutorEarnings: 1,
    status: 1,
    paidAt: 1,
    createdAt: 1,
};

export const PAYMENT_DETAIL_PROJECTION = {
    _id: 1,
    applicationId: 1,
    tuitionId: 1,
    studentId: 1,
    tutorId: 1,
    amount: 1,
    platformFee: 1,
    tutorEarnings: 1,
    stripePaymentIntentId: 1,
    stripeSessionId: 1,
    status: 1,
    paidAt: 1,
    createdAt: 1,
    updatedAt: 1,
};

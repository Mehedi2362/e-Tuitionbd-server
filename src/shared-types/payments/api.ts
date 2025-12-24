export const PAYMENT_ROUTES = {
  ALL: "/payments",
  MY: "/payments/my",
  BY_ID: (id: string) => `/payments/${id}`,
  CREATE_INTENT: "/payments/create-intent",
  CREATE_CHECKOUT: "/payments/create-checkout-session",
  CONFIRM: "/payments/confirm",
  WEBHOOK: "/payments/webhook",
  SUCCESS: (sessionId: string) => `/payments/success/${sessionId}`,
  EARNINGS: "/payments/earnings",
} as const;

// ==================== Payment Constants ====================
export const PAYMENT_COLLECTION = "payments";
export const DEFAULT_PAYMENT_STATUS = "pending" as const;

// ==================== Payment Types ====================
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

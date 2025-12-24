import { getEnv } from "@/shared/utils/getEnv.js";

export const config = {
    port: getEnv.number("PORT", 5000),
    nodeEnv: getEnv.string("NODE_ENV", "development"),
    clientUrl: getEnv.string("CLIENT_URL", "http://localhost:3000"),
    jwtSecret: getEnv.string(
        "JWT_SECRET",
        "your-super-secret-jwt-key-change-in-production"
    ),
    jwtExpiresIn: getEnv.string("JWT_EXPIRES_IN", "7d"),
    mongodbUri: getEnv.string("MONGODB_URI", ""),
    dbName: getEnv.string("DB_NAME", "etuitionbd"),
    stripeSecretKey: getEnv.string("STRIPE_SECRET_KEY", ""),
    platformFeePercentage: getEnv.number("PLATFORM_FEE_PERCENTAGE", 10),
};


export const logsConfig = {
    enableLogs: {
        server: config.nodeEnv === "development",
        database: config.nodeEnv === "development",
        requests: config.nodeEnv === "development",
        errors: true, // Always log errors
    },
};
import admin, { ServiceAccount } from "firebase-admin";

import { getEnv } from "@/shared/utils/getEnv.js";

export class firebase {
    static #app: admin.app.App | null = null;
    static #adminSDK = Buffer.from(getEnv.string('FIREBASE_ADMIN_SDK_JSON'), 'base64').toString()

    static init() {
        if (this.#app) return this.#app;
        try {
            this.#app = admin.initializeApp({ credential: admin.credential.cert(JSON.parse(this.#adminSDK) as ServiceAccount) })
            this.logs.init.success()
        } catch (err) {
            this.logs.init.failed(err);
            throw err;
        }
    }

    static verifyToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
        try {
            if (!this.#app) this.init();
            const decodedIdToken = await admin.auth().verifyIdToken(idToken)
            return decodedIdToken
        } catch (error) {
            console.error('Firebase token verification error:', error);
            throw new Error("Invalid or expired Firebase token");
        }
    }

    static logs = {
        init: {
            success: () => console.log("✅ Firebase Admin SDK initialized successfully"),
            failed: (err: unknown) => console.error("❌ Firebase Admin SDK initialization error:", err)
        }
    }
}
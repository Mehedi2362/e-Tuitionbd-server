import admin, { ServiceAccount } from "firebase-admin";

import { getEnv } from "@/shared/utils/getEnv.js";

export class firebase {
    static #app: admin.app.App | null = null;
    static #initFailed: boolean = false;

    static #getServiceAccount(): ServiceAccount {
        const base64Json = getEnv.string('FIREBASE_ADMIN_SDK_JSON');

        // Debug: log the length of base64 string
        console.log(`[Firebase] Base64 string length: ${base64Json.length}`);

        const adminSdkJson = Buffer.from(base64Json, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(adminSdkJson) as ServiceAccount & { private_key?: string };

        // Debug: log the first/last chars of private key
        if (serviceAccount.private_key) {
            const pk = serviceAccount.private_key;
            console.log(`[Firebase] Private key starts with: ${pk.substring(0, 30)}...`);
            console.log(`[Firebase] Private key ends with: ...${pk.substring(pk.length - 30)}`);
            console.log(`[Firebase] Private key length: ${pk.length}`);

            // Fix private key newlines - handle multiple escape scenarios
            serviceAccount.private_key = pk
                .replace(/\\\\n/g, '\n')  // Double escaped \\n -> \n
                .replace(/\\n/g, '\n');   // Single escaped \n -> \n
        }

        return serviceAccount;
    }

    static init() {
        if (this.#app) return this.#app;
        if (this.#initFailed) return null; // Don't retry if already failed

        try {
            const serviceAccount = this.#getServiceAccount();
            this.#app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
            this.logs.init.success()
            return this.#app;
        } catch (err) {
            this.#initFailed = true;
            this.logs.init.failed(err);
            // Don't throw - allow app to start without Firebase for now
            console.error('[Firebase] App will continue without Firebase authentication');
            return null;
        }
    }

    static verifyToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
        try {
            console.log('[Firebase] Verifying token, current app state:', this.#app ? 'initialized' : 'not initialized');

            if (!this.#app) {
                console.log('[Firebase] App not initialized, initializing...');
                this.init();
            }

            if (!this.#app) {
                throw new Error('Firebase Admin SDK failed to initialize');
            }

            console.log('[Firebase] Calling admin.auth().verifyIdToken()...');
            const decodedIdToken = await admin.auth().verifyIdToken(idToken);
            console.log('[Firebase] Token verified successfully:', { uid: decodedIdToken.uid, email: decodedIdToken.email });
            return decodedIdToken;
        } catch (error) {
            console.error('[Firebase] Token verification failed:', error);
            if (error instanceof Error) {
                throw new Error(`Firebase token verification failed: ${error.message}`);
            }
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
import { getEnv } from "@/shared/utils/getEnv.js";
import { Db, MongoClient, ServerApiVersion } from "mongodb";

export class db {
    static #db: Db | null = null;
    static #client: MongoClient | null = null;
    static #MONGODB_URI = getEnv.string('MONGODB_URI');
    static #DBNAME = getEnv.string("DB_NAME")

    // ==================== Connect to this ====================
    static async connect(): Promise<Db> {
        if (this.#db) return this.#db;

        if (!this.#MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }

        try {
            this.#client = new MongoClient(this.#MONGODB_URI, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                },
            });

            await this.#client.connect();
            await this.#client.db("admin").command({ ping: 1 });

            this.#db = this.#client.db(this.#DBNAME);

            this.logs.connect.success()
            return this.#db;

        } catch (error) {
            this.logs.connect.failed(error)
            throw error;
        }
    }

    // ==================== Get this Instance ====================
    static getDB(): Db {
        if (!this.#db) {
            throw new Error("this not initialized. Call this.connect() first.");
        }
        return this.#db;
    }

    // ==================== Close this Connection ====================
    static async close(): Promise<void> {
        try {
            if (this.#client) {
                await this.#client.close();
                this.#db = null;
                this.#client = null;
                this.logs.close.success();
            }
        } catch (err) {
            this.logs.close.failed(err)
            throw err
        }
    }

    static logs = {
        connect: {
            success: () => {
                console.log("✅ Successfully connected to MongoDB!");
                console.log(`📦 this: ${this.#DBNAME}`);
            },
            failed: (err: unknown) => console.error("❌ MongoDB connection error:", err)
        },
        close: {
            success: () => console.log("📤 Database connection closed"),
            failed: (err: unknown) => console.error("❌ Error closing database connection:", err)
        }
    }
}


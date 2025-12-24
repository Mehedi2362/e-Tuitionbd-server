/**
 * Admin User Creation Script
 * Run: pnpm tsx scripts/create-admin.ts
 * 
 * এই script MongoDB-এ একটি admin user তৈরি করে
 */

import 'dotenv/config';
import bcrypt from "bcrypt";
import { MongoClient, ServerApiVersion } from "mongodb";
import type { IUser } from "../src/shared/models/types.js";

const ADMIN_DATA = {
    name: "Admin User",
    email: "admin@etuitionbd.com",
    phone: "01700000000",
    password: "Admin@12345", // Change this!
    role: "admin" as const,
};

async function createAdmin() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        const DB_NAME = process.env.DB_NAME;

        if (!MONGODB_URI || !DB_NAME) {
            throw new Error("MONGODB_URI এবং DB_NAME environment variable-এ defined নেই");
        }

        console.log("🔧 MongoDB এ connected হচ্ছে...");
        
        const client = new MongoClient(MONGODB_URI, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });

        await client.connect();
        const database = client.db(DB_NAME);
        const usersCollection = database.collection<IUser>('users');

        // Check if admin already exists
        const existingAdmin = await usersCollection.findOne({ email: ADMIN_DATA.email });
        if (existingAdmin) {
            console.log("⚠️  Admin user ইতিমধ্যে exist করে:", ADMIN_DATA.email);
            await client.close();
            return;
        }

        // Hash password
        console.log("🔐 Password hash করছি...");
        const hashedPassword = await bcrypt.hash(ADMIN_DATA.password, 10);

        // Create admin user
        const adminUser: IUser = {
            name: ADMIN_DATA.name,
            email: ADMIN_DATA.email,
            phone: ADMIN_DATA.phone,
            password: hashedPassword,
            role: ADMIN_DATA.role,
            photoUrl: null,
            status: "active",
            qualifications: "",
            experience: "",
            subjects: [],
            bio: "",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await usersCollection.insertOne(adminUser);

        console.log("✅ Admin user সফলভাবে তৈরি হয়েছে!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📧 Email:   ", ADMIN_DATA.email);
        console.log("🔑 Password:", ADMIN_DATA.password);
        console.log("🆔 ID:      ", result.insertedId);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("⚠️  Password পরিবর্তন করুন!\n");

        await client.close();
    } catch (error) {
        console.error("❌ Error creating admin:", error);
        process.exit(1);
    }
}

createAdmin();

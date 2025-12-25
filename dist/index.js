// Bundled with tsup

// src/index.ts
import "dotenv/config.js";

// src/shared/utils/getEnv.ts
var getEnv = {
  string: (key, fallback) => {
    const value = process.env[key] ?? fallback;
    if (value === void 0) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    return value.trim();
  },
  number: (key, fallback) => (process.env[key] !== void 0 ? Number(process.env[key]) : fallback) ?? (() => {
    throw new Error(`Environment variable ${key} is not defined`);
  })(),
  boolean: (key, fallback) => (process.env[key] !== void 0 ? process.env[key].toLowerCase() === "true" || process.env[key] === "1" : fallback) ?? (() => {
    throw new Error(`Environment variable ${key} is not defined`);
  })(),
  multiple: (keys) => {
    const result = {};
    for (const key of keys) result[key] = getEnv.string(key);
    return result;
  }
};

// src/config/db.ts
import { MongoClient, ServerApiVersion } from "mongodb";
var db = class {
  static #db = null;
  static #client = null;
  static #MONGODB_URI = getEnv.string("MONGODB_URI");
  static #DBNAME = getEnv.string("DB_NAME");
  // ==================== Connect to this ====================
  static async connect() {
    if (this.#db) return this.#db;
    if (!this.#MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    try {
      this.#client = new MongoClient(this.#MONGODB_URI, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true
        }
      });
      await this.#client.connect();
      await this.#client.db("admin").command({ ping: 1 });
      this.#db = this.#client.db(this.#DBNAME);
      this.logs.connect.success();
      return this.#db;
    } catch (error) {
      this.logs.connect.failed(error);
      throw error;
    }
  }
  // ==================== Get this Instance ====================
  static getDB() {
    if (!this.#db) {
      throw new Error("this not initialized. Call this.connect() first.");
    }
    return this.#db;
  }
  // ==================== Close this Connection ====================
  static async close() {
    try {
      if (this.#client) {
        await this.#client.close();
        this.#db = null;
        this.#client = null;
        this.logs.close.success();
      }
    } catch (err) {
      this.logs.close.failed(err);
      throw err;
    }
  }
  static logs = {
    connect: {
      success: () => {
        console.log("\u2705 Successfully connected to MongoDB!");
        console.log(`\u{1F4E6} this: ${this.#DBNAME}`);
      },
      failed: (err) => console.error("\u274C MongoDB connection error:", err)
    },
    close: {
      success: () => console.log("\u{1F4E4} Database connection closed"),
      failed: (err) => console.error("\u274C Error closing database connection:", err)
    }
  };
};

// src/config/server.ts
var Server = class {
  static #PORT = getEnv.number("PORT", 5e3);
  static #CLIENT = getEnv.string("CLIENT_URL", "http://localhost:3000");
  static #API_BASE = "api/v1";
  static async start(app2) {
    try {
      await db.connect();
      app2.listen(this.#PORT, () => {
        this.logs.start.success();
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logs.start.failed(message);
      process.exit(1);
    }
  }
  static logs = {
    start: {
      success: () => {
        console.log(`\u{1F680} Server running on port ${this.#PORT}`);
        console.log(`\u{1F310} Client URL: ${this.#CLIENT}`);
        console.log(`\u{1F4E1} API Base: ${this.#API_BASE}`);
      },
      failed: (err = "") => console.error("\u274C Failed to start server:", err)
    }
  };
};

// src/index.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

// src/shared/constants/index.ts
var HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};
var ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized. Please log in to continue.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "Resource not found.",
  INVALID_TOKEN: "Invalid or expired token.",
  NO_TOKEN: "No token provided.",
  INVALID_CREDENTIALS: "Invalid credentials.",
  USER_EXISTS: "User already exists with this email.",
  INVALID_ROLE: "Invalid role. Must be student, tutor, or admin.",
  VALIDATION_ERROR: "Validation error. Please check your input.",
  SERVER_ERROR: "Internal server error. Please try again later.",
  DATABASE_ERROR: "Database error. Please try again later."
};
var SUCCESS_MESSAGES = {
  LOGIN: "Login successful.",
  REGISTER: "Registration successful.",
  LOGOUT: "Logout successful.",
  CREATED: "Resource created successfully.",
  UPDATED: "Resource updated successfully.",
  DELETED: "Resource deleted successfully.",
  FETCHED: "Data fetched successfully.",
  PROFILE_UPDATE: "Profile updated successfully.",
  ROLE_UPDATE: "User role updated successfully.",
  TUITION_CREATED: "Tuition posted successfully.",
  TUITION_UPDATED: "Tuition updated successfully.",
  TUITION_DELETED: "Tuition deleted successfully.",
  TUITIONS_FETCHED: "Tuitions fetched successfully.",
  APPLICATION_SUBMITTED: "Application submitted successfully.",
  APPLICATION_UPDATED: "Application updated successfully.",
  PAYMENT_SUCCESS: "Payment completed successfully."
};

// src/shared/middleware/error.ts
var AppError = class extends Error {
  statusCode;
  isOperational;
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
};
var asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
var notFoundHandler = (req, res, _next) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};
var errorHandler = (err, _req, res, _next) => {
  const statusCode = err instanceof AppError ? err.statusCode : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || "Internal Server Error";
  console.error(`[Error] ${statusCode}: ${message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }
  res.status(statusCode).json({
    success: false,
    message,
    ...process.env.NODE_ENV === "development" && { stack: err.stack }
  });
};

// src/shared/middleware/validate.ts
var validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const zodError = result.error;
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: zodError.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message
        }))
      });
      return;
    }
    req.body = result.data;
    next();
  };
};

// src/features/auth/middleware.ts
import jwt from "jsonwebtoken";

// src/shared-types/auth/validators.ts
import { z } from "zod";
var SignInSchema = z.object({
  email: z.email({ message: "Email is required" }),
  password: z.string().min(8, "Password must be at least 8 characters")
});
var SignUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be at most 50 characters"),
  email: z.email({ message: "Email is required" }),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be at most 15 digits").regex(/^01[3-9][0-9]{8}$/, "Phone number must contain only digits"),
  role: z.enum(["student", "tutor"], {
    message: "Role is required and must be student or tutor"
  }),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number").regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// src/shared-types/auth/api.ts
var AUTH_ROUTES = {
  SIGNUP: "/auth/signup",
  SIGNIN: "/auth/signin",
  SIGNOUT: "/auth/signout",
  GOOGLE: "/auth/google",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  REFRESH: "/auth/refresh-token",
  ME: "/auth/me",
  VERIFY: "/auth/verify"
};

// src/shared-types/auth/constants.ts
var ROLES = {
  STUDENT: "student",
  TUTOR: "tutor",
  ADMIN: "admin"
};

// src/features/auth/middleware.ts
var extractToken = (req) => {
  const cookieToken = req.cookies?.["auth_token"];
  if (cookieToken) return cookieToken;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split("Bearer ")[1];
  }
  return null;
};
var authMiddleware = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: ERROR_MESSAGES.NO_TOKEN });
    return;
  }
  try {
    req.user = jwt.verify(token, getEnv.string("JWT_SECRET"));
    return next();
  } catch {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: ERROR_MESSAGES.INVALID_TOKEN });
    return;
  }
};
var requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.email) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED
        });
        return;
      }
      const database = await db.getDB();
      const user = await database.collection("users").findOne({ email: req.user.email });
      if (!user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "User not found in database."
        });
        return;
      }
      const userRole = user.role.trim();
      if (!roles.includes(userRole)) {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: ERROR_MESSAGES.FORBIDDEN
        });
        return;
      }
      req.user = { ...req.user, role: user.role };
      next();
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.SERVER_ERROR,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
};
var adminMiddleware = requireRole(ROLES.ADMIN);
var studentMiddleware = requireRole(ROLES.STUDENT);
var tutorMiddleware = requireRole(ROLES.TUTOR);
var studentOrTutorMiddleware = requireRole(ROLES.STUDENT, ROLES.TUTOR);
var anyRoleMiddleware = requireRole(ROLES.STUDENT, ROLES.TUTOR, ROLES.ADMIN);
var guestMiddleware = (req, res, next) => {
  const cookieToken = req.cookies?.["auth_token"];
  if (cookieToken) {
    try {
      jwt.verify(cookieToken, getEnv.string("JWT_SECRET"));
      res.status(403).json({ message: `Already authenticated users cannot access this route` });
      return;
    } catch {
      res.clearCookie("auth_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
      });
    }
  }
  next();
};
var optionalAuth = async (req, _res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, getEnv.string("JWT_SECRET"));
    } catch {
    }
  }
  next();
};

// src/features/payments/controller.ts
import Stripe from "stripe";

// src/config/app.config.ts
var config = {
  port: getEnv.number("PORT", 5e3),
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
  platformFeePercentage: getEnv.number("PLATFORM_FEE_PERCENTAGE", 10)
};
var logsConfig = {
  enableLogs: {
    server: config.nodeEnv === "development",
    database: config.nodeEnv === "development",
    requests: config.nodeEnv === "development",
    errors: true
    // Always log errors
  }
};

// src/config/firebase.ts
import admin from "firebase-admin";
var firebase = class {
  static #app = null;
  static #initFailed = false;
  static #getServiceAccount() {
    const base64Json = getEnv.string("FIREBASE_ADMIN_SDK_JSON");
    console.log(`[Firebase] Base64 string length: ${base64Json.length}`);
    const adminSdkJson = Buffer.from(base64Json, "base64").toString("utf-8");
    const serviceAccount = JSON.parse(adminSdkJson);
    if (serviceAccount.private_key) {
      const pk = serviceAccount.private_key;
      console.log(`[Firebase] Private key starts with: ${pk.substring(0, 30)}...`);
      console.log(`[Firebase] Private key ends with: ...${pk.substring(pk.length - 30)}`);
      console.log(`[Firebase] Private key length: ${pk.length}`);
      serviceAccount.private_key = pk.replace(/\\\\n/g, "\n").replace(/\\n/g, "\n");
    }
    return serviceAccount;
  }
  static init() {
    if (this.#app) return this.#app;
    if (this.#initFailed) return null;
    try {
      const serviceAccount = this.#getServiceAccount();
      this.#app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      this.logs.init.success();
      return this.#app;
    } catch (err) {
      this.#initFailed = true;
      this.logs.init.failed(err);
      console.error("[Firebase] App will continue without Firebase authentication");
      return null;
    }
  }
  static verifyToken = async (idToken) => {
    try {
      console.log("[Firebase] Verifying token, current app state:", this.#app ? "initialized" : "not initialized");
      if (!this.#app) {
        console.log("[Firebase] App not initialized, initializing...");
        this.init();
      }
      if (!this.#app) {
        throw new Error("Firebase Admin SDK failed to initialize");
      }
      console.log("[Firebase] Calling admin.auth().verifyIdToken()...");
      const decodedIdToken = await admin.auth().verifyIdToken(idToken);
      console.log("[Firebase] Token verified successfully:", { uid: decodedIdToken.uid, email: decodedIdToken.email });
      return decodedIdToken;
    } catch (error) {
      console.error("[Firebase] Token verification failed:", error);
      if (error instanceof Error) {
        throw new Error(`Firebase token verification failed: ${error.message}`);
      }
      throw new Error("Invalid or expired Firebase token");
    }
  };
  static logs = {
    init: {
      success: () => console.log("\u2705 Firebase Admin SDK initialized successfully"),
      failed: (err) => console.error("\u274C Firebase Admin SDK initialization error:", err)
    }
  };
};

// src/shared/utils/helpers.ts
import { ObjectId } from "mongodb";
var toObjectId = (id) => {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
};

// src/shared/utils/pagination.ts
var parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || "10", 10)));
  const skip = (page - 1) * limit;
  const sortField = query.sort || "createdAt";
  const sortOrder = query.order === "asc" ? 1 : -1;
  const sort = { [sortField]: sortOrder };
  return { page, limit, skip, sort };
};

// src/shared/utils/response.ts
var sendSuccess = (res, data, message = "Success") => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data
  });
};
var sendCreated = (res, data, message = "Created successfully") => {
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message,
    data
  });
};
var sendPaginated = (res, data, page, limit, total, message = "Data fetched successfully") => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
};
var sendError = (res, message, statusCode = HTTP_STATUS.BAD_REQUEST) => {
  res.status(statusCode).json({
    success: false,
    message
  });
};
var sendNotFound = (res, message = "Resource not found") => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message
  });
};

// src/shared/models/user.model.ts
import { ObjectId as ObjectId2 } from "mongodb";

// src/shared/models/constants.ts
var PUBLIC_USER_PROJECTION = {
  email: 1,
  name: 1,
  phone: 1,
  role: 1,
  photoUrl: 1,
  qualifications: 1,
  experience: 1,
  subjects: 1,
  bio: 1,
  status: 1,
  createdAt: 1
};
var TUITION_LIST_PROJECTION = {
  _id: 1,
  studentName: 1,
  student: 1,
  subject: 1,
  class: 1,
  location: 1,
  budget: 1,
  schedule: 1,
  status: 1,
  applicationsCount: 1,
  createdAt: 1
};
var APPLICATION_LIST_PROJECTION = {
  _id: 1,
  tuitionId: 1,
  tutorId: 1,
  tutorName: 1,
  tutorEmail: 1,
  tutorPhotoUrl: 1,
  qualifications: 1,
  experience: 1,
  expectedSalary: 1,
  status: 1,
  createdAt: 1
};
var PAYMENT_LIST_PROJECTION = {
  _id: 1,
  applicationId: 1,
  tuitionId: 1,
  studentId: 1,
  tutorId: 1,
  amount: 1,
  platformFee: 1,
  tutorEarnings: 1,
  status: 1,
  paidAt: 1,
  createdAt: 1
};

// src/shared/models/user.model.ts
var DEFAULT_USER_ROLE = "student";
var DEFAULT_USER_STATUS = "active";
var UserModel = class {
  static get collection() {
    return db.getDB().collection("users");
  }
  // Create new user
  static async create(data) {
    const newUser = {
      name: data.name || "",
      email: data.email,
      phone: data.phone || null,
      role: data.role || DEFAULT_USER_ROLE,
      password: data.password || "",
      photoUrl: data.photoUrl || null,
      status: data.status || DEFAULT_USER_STATUS,
      qualifications: data.qualifications || "",
      experience: data.experience || "",
      subjects: data.subjects || [],
      bio: data.bio || "",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const result = await this.collection.insertOne(newUser);
    return { ...newUser, _id: result.insertedId };
  }
  // Find by ID
  static async findById(id) {
    const objectId = typeof id === "string" ? new ObjectId2(id) : id;
    return this.collection.findOne({ _id: objectId });
  }
  // Find by email
  static async findByEmail(email) {
    return this.collection.findOne({ email });
  }
  // Find all with pagination
  static async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    const [data, total] = await Promise.all([
      this.collection.find(filter, { projection: PUBLIC_USER_PROJECTION }).sort(sort).skip(skip).limit(limit).toArray(),
      this.collection.countDocuments(filter)
    ]);
    return { data, total };
  }
  // Find tutors
  static async findTutors(filter = {}, options = {}) {
    const tutorFilter = { ...filter, role: "tutor" };
    return this.findAll(tutorFilter, options);
  }
  // Update by Email
  static async updateByEmail(email, data) {
    const updateData = {
      $set: { ...data, updatedAt: /* @__PURE__ */ new Date() }
    };
    const result = await this.collection.findOneAndUpdate({ email }, updateData, { returnDocument: "after" });
    return result;
  }
  // Update by ID
  static async updateById(id, data) {
    const objectId = typeof id === "string" ? new ObjectId2(id) : id;
    const updateData = {
      $set: { ...data, updatedAt: /* @__PURE__ */ new Date() }
    };
    const result = await this.collection.findOneAndUpdate({ _id: objectId }, updateData, { returnDocument: "after" });
    return result;
  }
  // Update role
  static async updateRole(email, role) {
    return this.updateByEmail(email, { role });
  }
  // Ban/Unban user
  static async updateStatus(email, status) {
    return this.updateByEmail(email, { status });
  }
  // Delete by Email
  static async deleteByEmail(email) {
    const result = await this.collection.deleteOne({ email });
    return result.deletedCount > 0;
  }
  // Check if user exists
  static async exists(email) {
    const count = await this.collection.countDocuments({ email });
    return count > 0;
  }
  // Count users by role
  static async countByRole(role) {
    return this.collection.countDocuments({ role });
  }
  // Users grouped by role with counts
  static async usersByRole() {
    return this.collection.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $project: { role: "$_id", count: 1, _id: 0 } }
    ]).toArray();
  }
  // Get distinct values for tutor fields (API v1 compatible)
  static async getDistinctValues(field, filter = {}) {
    const results = await this.collection.aggregate([
      { $match: filter },
      { $unwind: `$${String(field)}` },
      { $group: { _id: `$${String(field)}` } },
      { $sort: { _id: 1 } }
    ]).toArray();
    return results.map((doc) => doc._id).filter((value) => value != null && value !== "").map((v) => String(v));
  }
};

// src/shared/models/tuition.model.ts
import { ObjectId as ObjectId3 } from "mongodb";
var DEFAULT_TUITION_STATUS = "pending";
var TuitionModel = class {
  static get collection() {
    return db.getDB().collection("tuitions");
  }
  // Create new tuition
  static async create(data) {
    const newTuition = {
      student: data.student,
      subject: data.subject,
      class: data.class,
      location: data.location,
      budget: data.budget,
      schedule: data.schedule,
      description: data.description || "",
      requirements: data.requirements || "",
      status: data.status || DEFAULT_TUITION_STATUS,
      applicationsCount: data.applicationsCount || 0,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const result = await this.collection.insertOne(newTuition);
    return { ...newTuition, _id: result.insertedId };
  }
  // Find by ID
  static async findById(id) {
    const objectId = typeof id === "string" ? new ObjectId3(id) : id;
    return this.collection.findOne({ _id: objectId });
  }
  // Find all with pagination and filters
  static async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    const [data, total] = await Promise.all([
      this.collection.find(filter, { projection: TUITION_LIST_PROJECTION }).sort(sort).skip(skip).limit(limit).toArray(),
      this.collection.countDocuments(filter)
    ]);
    return { data, total };
  }
  // Find by student ID
  static async findByStudentId(studentId, options = {}) {
    return this.findAll({ studentId }, options);
  }
  // Update by ID
  static async updateById(id, data) {
    const objectId = typeof id === "string" ? new ObjectId3(id) : id;
    const updateData = {
      $set: { ...data, updatedAt: /* @__PURE__ */ new Date() }
    };
    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      updateData,
      { returnDocument: "after" }
    );
    return result;
  }
  // Update status
  static async updateStatus(id, status) {
    return this.updateById(id, { status });
  }
  // Increment applications count
  static async incrementApplicationsCount(id) {
    const objectId = typeof id === "string" ? new ObjectId3(id) : id;
    const result = await this.collection.updateOne(
      { _id: objectId },
      { $inc: { applicationsCount: 1 }, $set: { updatedAt: /* @__PURE__ */ new Date() } }
    );
    return result.modifiedCount > 0;
  }
  // Decrement applications count
  static async decrementApplicationsCount(id) {
    const objectId = typeof id === "string" ? new ObjectId3(id) : id;
    const result = await this.collection.updateOne(
      { _id: objectId },
      { $inc: { applicationsCount: -1 }, $set: { updatedAt: /* @__PURE__ */ new Date() } }
    );
    return result.modifiedCount > 0;
  }
  // Delete by ID
  static async deleteById(id) {
    const objectId = typeof id === "string" ? new ObjectId3(id) : id;
    const result = await this.collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }
  // Check ownership
  static async isOwner(id, studentId) {
    const objectId = typeof id === "string" ? new ObjectId3(id) : id;
    const count = await this.collection.countDocuments({
      _id: objectId,
      studentId
    });
    return count > 0;
  }
  // Search tuitions
  static async search(query, options = {}) {
    const searchFilter = {
      $or: [
        { subject: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { class: { $regex: query, $options: "i" } }
      ]
    };
    return this.findAll(searchFilter, options);
  }
  // Get tuitions count grouped by status
  static async countByStatus() {
    return this.collection.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } }
    ]).toArray();
  }
  // Get distinct values for a field with filters using aggregation (API v1 compatible)
  static async getDistinctValues(field, filter = {}) {
    const results = await this.collection.aggregate([
      { $match: filter },
      { $group: { _id: `$${String(field)}` } },
      { $sort: { _id: 1 } }
    ]).toArray();
    return results.map((doc) => doc._id).filter((value) => value != null && value !== "").map((v) => String(v));
  }
};

// src/shared/models/application.model.ts
import { ObjectId as ObjectId4 } from "mongodb";
var DEFAULT_APPLICATION_STATUS = "pending";
var ApplicationModel = class {
  static get collection() {
    return db.getDB().collection("applications");
  }
  // Create new application
  static async create(data) {
    const newApplication = {
      tuitionId: data.tuitionId,
      tutorId: data.tutorId,
      tutorEmail: data.tutorEmail,
      tutorName: data.tutorName,
      tutorPhotoUrl: data.tutorPhotoUrl || null,
      qualifications: data.qualifications,
      experience: data.experience,
      expectedSalary: data.expectedSalary,
      coverLetter: data.coverLetter || "",
      status: data.status || DEFAULT_APPLICATION_STATUS,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const result = await this.collection.insertOne(newApplication);
    return { ...newApplication, _id: result.insertedId };
  }
  // Find by ID
  static async findById(id) {
    const objectId = typeof id === "string" ? new ObjectId4(id) : id;
    return this.collection.findOne({ _id: objectId });
  }
  // Find all with pagination
  static async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    const [data, total] = await Promise.all([
      this.collection.find(filter, { projection: APPLICATION_LIST_PROJECTION }).sort(sort).skip(skip).limit(limit).toArray(),
      this.collection.countDocuments(filter)
    ]);
    return { data, total };
  }
  // Find by tuition ID
  static async findByTuitionId(tuitionId, options = {}) {
    const objectId = typeof tuitionId === "string" ? new ObjectId4(tuitionId) : tuitionId;
    return this.findAll({ tuitionId: objectId }, options);
  }
  // Find by tutor ID
  static async findByTutorId(tutorId, options = {}) {
    return this.findAll({ tutorId }, options);
  }
  // Update by ID
  static async updateById(id, data) {
    const objectId = typeof id === "string" ? new ObjectId4(id) : id;
    const updateData = {
      $set: { ...data, updatedAt: /* @__PURE__ */ new Date() }
    };
    const result = await this.collection.findOneAndUpdate({ _id: objectId }, updateData, { returnDocument: "after" });
    return result;
  }
  // Update status
  static async updateStatus(id, status) {
    return this.updateById(id, { status });
  }
  // Delete by ID
  static async deleteById(id) {
    const objectId = typeof id === "string" ? new ObjectId4(id) : id;
    const result = await this.collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }
  // Delete by tuition ID (when tuition is deleted)
  static async deleteByTuitionId(tuitionId) {
    const objectId = typeof tuitionId === "string" ? new ObjectId4(tuitionId) : tuitionId;
    const result = await this.collection.deleteMany({ tuitionId: objectId });
    return result.deletedCount;
  }
  // Check if tutor already applied
  static async hasApplied(tuitionId, tutorId) {
    const objectId = typeof tuitionId === "string" ? new ObjectId4(tuitionId) : tuitionId;
    const count = await this.collection.countDocuments({ tuitionId: objectId, tutorId });
    return count > 0;
  }
  // Check ownership
  static async isOwner(id, tutorId) {
    const objectId = typeof id === "string" ? new ObjectId4(id) : id;
    const count = await this.collection.countDocuments({ _id: objectId, tutorId });
    return count > 0;
  }
  // Get applications count grouped by status
  static async countByStatus() {
    const result = await this.collection.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();
    return result.map((item) => ({ status: item._id, count: item.count }));
  }
};

// src/shared/models/payment.model.ts
import { ObjectId as ObjectId5 } from "mongodb";
var DEFAULT_PAYMENT_STATUS = "pending";
var PaymentModel = class {
  static get collection() {
    return db.getDB().collection("payments");
  }
  // Calculate platform fee and tutor earnings
  static calculateAmounts(amount) {
    const platformFee = Math.round(amount * 10 / 100);
    const tutorEarnings = amount - platformFee;
    return { platformFee, tutorEarnings };
  }
  // Create new payment
  static async create(data) {
    const { platformFee, tutorEarnings } = this.calculateAmounts(data.amount);
    const newPayment = {
      applicationId: data.applicationId,
      tuitionId: data.tuitionId,
      studentId: data.studentId,
      tutorId: data.tutorId,
      amount: data.amount,
      platformFee,
      tutorEarnings,
      stripePaymentIntentId: data.stripePaymentIntentId || void 0,
      stripeSessionId: data.stripeSessionId || void 0,
      status: data.status || DEFAULT_PAYMENT_STATUS,
      paidAt: data.paidAt || void 0,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const result = await this.collection.insertOne(newPayment);
    return { ...newPayment, _id: result.insertedId };
  }
  // Find by ID
  static async findById(id) {
    const objectId = typeof id === "string" ? new ObjectId5(id) : id;
    return this.collection.findOne({ _id: objectId });
  }
  // Find by Stripe session ID
  static async findBySessionId(sessionId) {
    return this.collection.findOne({ stripeSessionId: sessionId });
  }
  // Find all with pagination
  static async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    const [data, total] = await Promise.all([
      this.collection.find(filter, { projection: PAYMENT_LIST_PROJECTION }).sort(sort).skip(skip).limit(limit).toArray(),
      this.collection.countDocuments(filter)
    ]);
    return { data, total };
  }
  // Find by student ID
  static async findByStudentId(studentId, options = {}) {
    return this.findAll({ studentId }, options);
  }
  // Find by tutor ID
  static async findByTutorId(tutorId, options = {}) {
    return this.findAll({ tutorId }, options);
  }
  // Update by ID
  static async updateById(id, data) {
    const objectId = typeof id === "string" ? new ObjectId5(id) : id;
    const updateData = {
      $set: { ...data, updatedAt: /* @__PURE__ */ new Date() }
    };
    const result = await this.collection.findOneAndUpdate({ _id: objectId }, updateData, { returnDocument: "after" });
    return result;
  }
  // Update status
  static async updateStatus(id, status, paidAt) {
    const updateData = { status };
    if (paidAt) updateData.paidAt = paidAt;
    return this.updateById(id, updateData);
  }
  // Mark as completed
  static async markCompleted(id) {
    return this.updateStatus(id, "completed", /* @__PURE__ */ new Date());
  }
  // Get total earnings for tutor
  static async getTutorEarnings(tutorId) {
    const result = await this.collection.aggregate([
      { $match: { tutorId, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$tutorEarnings" } } }
    ]).toArray();
    return result[0]?.total || 0;
  }
  // Get platform total earnings
  static async getPlatformEarnings() {
    const result = await this.collection.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$platformFee" } } }
    ]).toArray();
    return result[0]?.total || 0;
  }
  static async revenue(startDate = new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth() - 1, 1), endDate = new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1)) {
    const result = await this.collection.aggregate([
      {
        $match: {
          status: "completed",
          paidAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$platformFee" }
        }
      }
    ]).toArray();
    return result[0]?.total || 0;
  }
};

// src/shared/models/review.model.ts
import { ObjectId as ObjectId6 } from "mongodb";
var ReviewModel = class {
  static get collection() {
    return db.getDB().collection("reviews");
  }
  // Create new review
  static async create(data) {
    const newReview = {
      tutorId: data.tutorId,
      studentId: data.studentId,
      studentName: data.studentName,
      studentPhoto: data.studentPhoto || void 0,
      rating: data.rating,
      comment: data.comment,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const result = await this.collection.insertOne(newReview);
    return { ...newReview, _id: result.insertedId };
  }
  // Find by ID
  static async findById(id) {
    const objectId = typeof id === "string" ? new ObjectId6(id) : id;
    return this.collection.findOne({ _id: objectId });
  }
  // Find reviews by tutor ID
  static async findByTutor(tutorId, options = {}) {
    const { skip = 0, limit = 10 } = options;
    const [data, total] = await Promise.all([
      this.collection.find({ tutorId }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      this.collection.countDocuments({ tutorId })
    ]);
    return { data, total };
  }
  // Find review by tutor and student
  static async findByTutorAndStudent(tutorId, studentId) {
    return this.collection.findOne({ tutorId, studentId });
  }
  // Find all reviews
  static async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10 } = options;
    const [data, total] = await Promise.all([
      this.collection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      this.collection.countDocuments(filter)
    ]);
    return { data, total };
  }
  // Update review by ID
  static async updateById(id, data) {
    const objectId = typeof id === "string" ? new ObjectId6(id) : id;
    const updateData = {
      $set: { ...data, updatedAt: /* @__PURE__ */ new Date() }
    };
    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      updateData,
      { returnDocument: "after" }
    );
    return result;
  }
  // Delete review by ID
  static async deleteById(id) {
    const objectId = typeof id === "string" ? new ObjectId6(id) : id;
    const result = await this.collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }
  // Delete reviews by tutor (for cascading delete)
  static async deleteByTutor(tutorId) {
    const result = await this.collection.deleteMany({ tutorId });
    return result.deletedCount;
  }
  // Get average rating for tutor
  static async getAverageRating(tutorId) {
    const result = await this.collection.aggregate([
      { $match: { tutorId } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }
    ]).toArray();
    return result.length > 0 ? Math.round((result[0].avgRating + Number.EPSILON) * 10) / 10 : 0;
  }
  // Get review count for tutor
  static async getReviewCount(tutorId) {
    return this.collection.countDocuments({ tutorId });
  }
};

// src/features/payments/controller.ts
var stripe = new Stripe(config.stripeSecretKey);
var PaymentController = class {
  // ==================== Create Checkout Session ====================
  static async createCheckoutSession(req, res) {
    const { applicationId } = req.body;
    const { email } = req.user;
    const appObjectId = toObjectId(applicationId);
    if (!appObjectId) {
      sendError(res, "Invalid application ID");
      return;
    }
    const application = await ApplicationModel.findById(appObjectId);
    if (!application) {
      sendNotFound(res, "Application not found");
      return;
    }
    const tuition = await TuitionModel.findById(application.tuitionId);
    if (!tuition) {
      sendNotFound(res, "Tuition not found");
      return;
    }
    if (tuition.student.email !== email) {
      sendError(res, "You can only pay for your own tuitions", 403);
      return;
    }
    if (application.status !== "approved") {
      sendError(res, "Application must be approved before payment", 400);
      return;
    }
    const payment = await PaymentModel.create({
      applicationId: appObjectId,
      tuitionId: application.tuitionId,
      studentId: email,
      tutorId: application.tutorId,
      amount: application.expectedSalary
    });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `Tuition: ${tuition.subject}`,
              description: `Tutor: ${application.tutorName}`
            },
            unit_amount: application.expectedSalary * 100
            // Convert to paisa
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${config.clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.clientUrl}/payment/cancel`,
      metadata: {
        paymentId: payment._id.toString(),
        applicationId
      }
    });
    await PaymentModel.updateById(payment._id, {
      stripeSessionId: session.id
    });
    sendCreated(
      res,
      { sessionId: session.id, url: session.url },
      "Checkout session created"
    );
  }
  // ==================== Verify Payment ====================
  static async verifyPayment(req, res) {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      sendNotFound(res, "Session not found");
      return;
    }
    const payment = await PaymentModel.findBySessionId(sessionId);
    if (!payment) {
      sendNotFound(res, "Payment not found");
      return;
    }
    if (session.payment_status === "paid" && payment.status !== "completed") {
      await PaymentModel.markCompleted(payment._id);
      await ApplicationModel.updateStatus(payment.applicationId, "completed");
      await TuitionModel.updateStatus(payment.tuitionId, "completed");
    }
    const updatedPayment = await PaymentModel.findById(payment._id);
    sendSuccess(res, updatedPayment, "Payment verified successfully");
  }
  // ==================== Get My Payments (Student) ====================
  static async getMyPayments(req, res) {
    const { skip, limit, page } = parsePagination(req.query);
    const { email } = req.user;
    const { data: payments, total } = await PaymentModel.findByStudentId(email, {
      skip,
      limit
    });
    sendPaginated(
      res,
      payments,
      page,
      limit,
      total,
      "Payments fetched successfully"
    );
  }
  // ==================== Get Tutor Earnings ====================
  static async getTutorEarnings(req, res) {
    const { skip, limit, page } = parsePagination(req.query);
    const { email } = req.user;
    const [{ data: payments, total }, totalEarnings] = await Promise.all([
      PaymentModel.findByTutorId(email, { skip, limit }),
      PaymentModel.getTutorEarnings(email)
    ]);
    sendSuccess(
      res,
      {
        payments,
        totalEarnings,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
      },
      "Earnings fetched successfully"
    );
  }
  // ==================== Get All Payments (Admin) ====================
  static async getAllPayments(req, res) {
    const { skip, limit, page } = parsePagination(req.query);
    const { data: payments, total } = await PaymentModel.findAll(
      {},
      { skip, limit }
    );
    sendPaginated(
      res,
      payments,
      page,
      limit,
      total,
      "All payments fetched successfully"
    );
  }
  // ==================== Get Payment by ID ====================
  static async getById(req, res) {
    const { id } = req.params;
    const objectId = toObjectId(id);
    if (!objectId) {
      sendError(res, "Invalid payment ID");
      return;
    }
    const payment = await PaymentModel.findById(objectId);
    if (!payment) {
      sendNotFound(res, "Payment not found");
      return;
    }
    sendSuccess(res, payment, "Payment fetched successfully");
  }
};

// src/features/payments/model.ts
import { ObjectId as ObjectId7 } from "mongodb";

// src/shared-types/payments/api.ts
var PAYMENT_ROUTES = {
  ALL: "/payments",
  MY: "/payments/my",
  BY_ID: (id) => `/payments/${id}`,
  CREATE_INTENT: "/payments/create-intent",
  CREATE_CHECKOUT: "/payments/create-checkout-session",
  CONFIRM: "/payments/confirm",
  WEBHOOK: "/payments/webhook",
  SUCCESS: (sessionId) => `/payments/success/${sessionId}`,
  EARNINGS: "/payments/earnings"
};

// src/features/payments/routes.ts
import { Router } from "express";
var router = Router();
router.post(
  PAYMENT_ROUTES.CREATE_CHECKOUT,
  authMiddleware,
  studentMiddleware,
  asyncHandler(PaymentController.createCheckoutSession)
);
router.get(
  PAYMENT_ROUTES.MY,
  authMiddleware,
  studentMiddleware,
  asyncHandler(PaymentController.getMyPayments)
);
router.get(
  PAYMENT_ROUTES.SUCCESS(":sessionId"),
  authMiddleware,
  asyncHandler(PaymentController.verifyPayment)
);
router.get(
  PAYMENT_ROUTES.EARNINGS,
  authMiddleware,
  tutorMiddleware,
  asyncHandler(PaymentController.getTutorEarnings)
);
router.get(
  PAYMENT_ROUTES.ALL,
  authMiddleware,
  adminMiddleware,
  asyncHandler(PaymentController.getAllPayments)
);
router.get(
  PAYMENT_ROUTES.BY_ID(":id"),
  authMiddleware,
  asyncHandler(PaymentController.getById)
);
var routes_default = router;

// src/features/dashboard/index.ts
import { Router as Router5 } from "express";

// src/shared-types/dashboard/shared.ts
var PROFILE_ROUTES = {
  GET: "/profile/me",
  ME: "/profile/me",
  UPDATE: "/profile/update"
};

// src/features/dashboard/shared.controller.ts
var SharedDashboardController = class {
  // ==================== Get Profile ====================
  static async getProfile(req, res) {
    const user = await UserModel.findByEmail(req.user.email);
    if (!user) {
      sendNotFound(res, "User not found");
      return;
    }
    sendSuccess(res, user, "Profile fetched successfully");
  }
  // ==================== Update Profile ====================
  static async updateProfile(req, res) {
    const { name, phone, qualifications, experience, subjects, bio } = req.body;
    const updateData = {};
    if (name !== void 0) updateData.name = name;
    if (phone !== void 0) updateData.phone = phone;
    if (qualifications !== void 0)
      updateData.qualifications = qualifications;
    if (experience !== void 0) updateData.experience = experience;
    if (subjects !== void 0) updateData.subjects = subjects;
    if (bio !== void 0) updateData.bio = bio;
    const user = await UserModel.updateByEmail(req.user.email, updateData);
    if (!user) {
      sendNotFound(res, "User not found");
      return;
    }
    sendSuccess(res, user, SUCCESS_MESSAGES.PROFILE_UPDATE);
  }
};

// src/features/dashboard/admin/controller.ts
var AdminDashboardController = class {
  // ==================== Get Dashboard Stats ====================
  static async getDashboard(_req, res) {
    const [
      { total: totalUsers },
      { total: totalTuitions },
      { total: totalApplications },
      { data: recentTransactions, total: totalPayments },
      totalRevenue
    ] = await Promise.all([
      UserModel.findAll({}, { limit: 0 }),
      TuitionModel.findAll({}, { limit: 0 }),
      ApplicationModel.findAll({}, { limit: 0 }),
      PaymentModel.findAll({}, { limit: 10, sort: { createdAt: -1 } }),
      PaymentModel.getPlatformEarnings()
    ]);
    const stats = {
      totalUsers,
      totalTuitions,
      totalApplications,
      totalPayments,
      totalRevenue,
      recentTransactions
    };
    sendSuccess(res, stats, "Dashboard stats fetched successfully");
  }
  // ==================== Get Analytics Data ====================
  static async getAnalytics(_req, res) {
    sendSuccess(
      res,
      {
        revenue: await PaymentModel.revenue(),
        usersByRole: await UserModel.usersByRole(),
        tuitionsByStatus: await TuitionModel.countByStatus(),
        applicationsByStatus: await ApplicationModel.countByStatus()
      },
      "Analytics data fetched successfully"
    );
  }
  // ==================== Get All Users ====================
  static async getUsers(req, res) {
    const { page, limit, skip, sort } = parsePagination(
      req.query
    );
    const { role, status, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    const { data: users, total } = await UserModel.findAll(query, { skip, limit, sort });
    sendPaginated(res, users, page, limit, total);
  }
  // ==================== Get User by Email ====================
  static async getUserByEmail(req, res) {
    const { email } = req.params;
    const user = await UserModel.findByEmail(email);
    if (!user) {
      sendNotFound(res, "User not found");
      return;
    }
    sendSuccess(res, user, "User fetched successfully");
  }
  // ==================== Update User Role ====================
  static async updateUserRole(req, res) {
    const { email } = req.params;
    const { role } = req.body;
    const user = await UserModel.updateRole(email, role);
    if (!user) {
      sendNotFound(res, "User not found");
      return;
    }
    sendSuccess(res, user, "User role updated successfully");
  }
  // ==================== Update User Status (Ban/Unban) ====================
  static async updateUserStatus(req, res) {
    const { email } = req.params;
    const { status } = req.body;
    const user = await UserModel.updateStatus(email, status);
    if (!user) {
      sendNotFound(res, "User not found");
      return;
    }
    sendSuccess(res, user, "User status updated successfully");
  }
  // ==================== Delete User ====================
  static async deleteUser(req, res) {
    const { email } = req.params;
    const deleted = await UserModel.deleteByEmail(email);
    if (!deleted) {
      sendNotFound(res, "User not found");
      return;
    }
    sendSuccess(res, null, "User deleted successfully");
  }
  // ==================== Get Tuition Statistics (Separate) ====================
  static async getTuitionStats(req, res) {
    const statArray = await TuitionModel.countByStatus();
    const stats = statArray.reduce(
      (acc, item) => {
        acc[item.status] = item.count;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    sendSuccess(
      res,
      {
        total,
        pending: stats.pending,
        approved: stats.approved,
        rejected: stats.rejected
      },
      "Tuition stats fetched successfully"
    );
  }
  // ==================== Get All Tuitions ====================
  static async getTuitions(req, res) {
    const { page, limit, skip, sort } = parsePagination(
      req.query
    );
    const { status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { studentName: { $regex: search, $options: "i" } }
      ];
    }
    const { data: tuitions, total } = await TuitionModel.findAll(query, { skip, limit, sort });
    sendPaginated(res, tuitions, page, limit, total);
  }
  // ==================== Update Tuition Status (Approve/Reject) ====================
  static async updateTuitionStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    const objectId = toObjectId(id);
    if (!objectId) {
      sendNotFound(res, "Invalid tuition ID");
      return;
    }
    const tuition = await TuitionModel.updateStatus(objectId, status);
    if (!tuition) {
      sendNotFound(res, "Tuition not found");
      return;
    }
    sendSuccess(res, tuition, "Tuition status updated successfully");
  }
  // ==================== Get All Applications ====================
  static async getApplications(req, res) {
    const { page, limit, skip, sort } = parsePagination(
      req.query
    );
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;
    const { data: applications, total } = await ApplicationModel.findAll(query, { skip, limit, sort });
    sendPaginated(res, applications, page, limit, total);
  }
  // ==================== Get All Payments ====================
  static async getPayments(req, res) {
    const { page, limit, skip, sort } = parsePagination(
      req.query
    );
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;
    const { data: payments, total } = await PaymentModel.findAll(query, { skip, limit, sort });
    sendPaginated(res, payments, page, limit, total);
  }
};

// src/features/dashboard/admin/routes.ts
import { Router as Router2 } from "express";

// src/shared-types/dashboard/admin.ts
var ADMIN_ROUTES = {
  DASHBOARD: "/dashboard",
  ANALYTICS: "/analytics"
};
var ADMIN_USER_ROUTES = {
  ALL: "/users",
  BY_ID: (uid) => `/users/${uid}`,
  UPDATE_ROLE: (uid) => `/users/${uid}/role`,
  UPDATE_STATUS: (uid) => `/users/${uid}/status`,
  DELETE: (uid) => `/users/${uid}`
};
var ADMIN_TUITION_ROUTES = {
  ALL: "/tuitions",
  BY_ID: (id) => `/tuitions/${id}`,
  UPDATE_STATUS: (id) => `/tuitions/${id}/status`,
  STATS: "/tuitions/stats/overview"
};
var ADMIN_APPLICATION_ROUTES = {
  ALL: "/applications",
  BY_ID: (id) => `/applications/${id}`
};
var ADMIN_PAYMENT_ROUTES = {
  ALL: "/payments",
  BY_ID: (id) => `/payments/${id}`
};

// src/features/dashboard/admin/routes.ts
var router2 = Router2();
router2.use(authMiddleware, adminMiddleware);
router2.get(
  ADMIN_ROUTES.DASHBOARD,
  AdminDashboardController.getDashboard
);
router2.get(
  ADMIN_ROUTES.ANALYTICS,
  AdminDashboardController.getAnalytics
);
router2.get(
  ADMIN_USER_ROUTES.ALL,
  AdminDashboardController.getUsers
);
router2.get(
  ADMIN_USER_ROUTES.BY_ID(":email"),
  AdminDashboardController.getUserByEmail
);
router2.patch(
  ADMIN_USER_ROUTES.UPDATE_ROLE(":email"),
  AdminDashboardController.updateUserRole
);
router2.patch(
  ADMIN_USER_ROUTES.UPDATE_STATUS(":email"),
  AdminDashboardController.updateUserStatus
);
router2.delete(
  ADMIN_USER_ROUTES.DELETE(":email"),
  AdminDashboardController.deleteUser
);
router2.get(
  ADMIN_TUITION_ROUTES.STATS,
  AdminDashboardController.getTuitionStats
);
router2.get(
  ADMIN_TUITION_ROUTES.ALL,
  AdminDashboardController.getTuitions
);
router2.patch(
  ADMIN_TUITION_ROUTES.UPDATE_STATUS(":id"),
  AdminDashboardController.updateTuitionStatus
);
router2.get(
  ADMIN_APPLICATION_ROUTES.ALL,
  AdminDashboardController.getApplications
);
router2.get(
  ADMIN_PAYMENT_ROUTES.ALL,
  AdminDashboardController.getPayments
);
var adminDashboardRouter = router2;

// src/features/dashboard/student/controller.ts
var StudentDashboardController = class {
  // ==================== Create Tuition ====================
  static async createTuition(req, res) {
    const {
      subject,
      class: className,
      location,
      budget,
      schedule,
      description,
      requirements
    } = req.body;
    const { email, name } = req.user;
    const tuition = await TuitionModel.create({
      student: { email, name: name || "Unknown" },
      subject,
      class: className,
      location,
      budget: Number(budget),
      schedule,
      description,
      requirements
    });
    sendCreated(res, tuition, SUCCESS_MESSAGES.TUITION_CREATED);
  }
  // ==================== Get My Tuitions ====================
  static async getMyTuitions(req, res) {
    const { skip, limit, page } = parsePagination(req.query);
    const { email } = req.user;
    const {
      subject,
      class: className,
      location,
      status,
      search
    } = req.query;
    const filter = {
      "student.email": email
    };
    if (subject) filter.subject = { $regex: subject, $options: "i" };
    if (className) filter.class = className;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { class: { $regex: search, $options: "i" } }
      ];
    }
    const { data: tuitions, total } = await TuitionModel.findAll(filter, {
      skip,
      limit
    });
    sendPaginated(
      res,
      tuitions,
      page,
      limit,
      total,
      "Your tuitions fetched successfully"
    );
  }
  // ==================== Update Tuition ====================
  static async updateTuition(req, res) {
    const { id } = req.params;
    const { email } = req.user;
    const {
      subject,
      class: className,
      location,
      budget,
      schedule,
      description,
      requirements
    } = req.body;
    const objectId = toObjectId(id);
    if (!objectId) {
      sendError(res, "Invalid tuition ID");
      return;
    }
    const isOwner = await TuitionModel.isOwner(objectId, email);
    if (!isOwner) {
      sendError(res, "You can only update your own tuitions", 403);
      return;
    }
    const updateData = {};
    if (subject !== void 0) updateData.subject = subject;
    if (className !== void 0) updateData.class = className;
    if (location !== void 0) updateData.location = location;
    if (budget !== void 0) updateData.budget = Number(budget);
    if (schedule !== void 0) updateData.schedule = schedule;
    if (description !== void 0) updateData.description = description;
    if (requirements !== void 0) updateData.requirements = requirements;
    const tuition = await TuitionModel.updateById(objectId, updateData);
    if (!tuition) {
      sendNotFound(res, "Tuition not found");
      return;
    }
    sendSuccess(res, tuition, SUCCESS_MESSAGES.TUITION_UPDATED);
  }
  // ==================== Delete Tuition ====================
  static async deleteTuition(req, res) {
    const { id } = req.params;
    const { email } = req.user;
    const objectId = toObjectId(id);
    if (!objectId) {
      sendError(res, "Invalid tuition ID");
      return;
    }
    const isOwner = await TuitionModel.isOwner(objectId, email);
    if (!isOwner) {
      sendError(res, "You can only delete your own tuitions", 403);
      return;
    }
    await ApplicationModel.deleteByTuitionId(objectId);
    const deleted = await TuitionModel.deleteById(objectId);
    if (!deleted) {
      sendNotFound(res, "Tuition not found");
      return;
    }
    sendSuccess(res, null, SUCCESS_MESSAGES.TUITION_DELETED);
  }
  // ==================== Get Applications For My Tuition ====================
  static async getApplicationsForTuition(req, res) {
    const { tuitionId } = req.params;
    const { email } = req.user;
    const { skip, limit, page } = parsePagination(req.query);
    const objectId = toObjectId(tuitionId);
    if (!objectId) {
      sendError(res, "Invalid tuition ID");
      return;
    }
    const isOwner = await TuitionModel.isOwner(objectId, email);
    if (!isOwner) {
      sendError(res, "You can only view applications for your own tuitions", 403);
      return;
    }
    const { data: applications, total } = await ApplicationModel.findByTuitionId(objectId, { skip, limit });
    sendPaginated(res, applications, page, limit, total, "Applications fetched successfully");
  }
  // ==================== Accept Application ====================
  static async acceptApplication(req, res) {
    const { id } = req.params;
    const { email } = req.user;
    const objectId = toObjectId(id);
    if (!objectId) {
      sendError(res, "Invalid application ID");
      return;
    }
    const application = await ApplicationModel.findById(objectId);
    if (!application) {
      sendNotFound(res, "Application not found");
      return;
    }
    const tuition = await TuitionModel.findById(application.tuitionId);
    if (!tuition || tuition.student.email !== email) {
      sendError(res, "You can only accept applications for your own tuitions", 403);
      return;
    }
    const updated = await ApplicationModel.updateStatus(objectId, "accepted");
    sendSuccess(res, updated, "Application accepted successfully");
  }
  // ==================== Reject Application ====================
  static async rejectApplication(req, res) {
    const { id } = req.params;
    const { email } = req.user;
    const objectId = toObjectId(id);
    if (!objectId) {
      sendError(res, "Invalid application ID");
      return;
    }
    const application = await ApplicationModel.findById(objectId);
    if (!application) {
      sendNotFound(res, "Application not found");
      return;
    }
    const tuition = await TuitionModel.findById(application.tuitionId);
    if (!tuition || tuition.student.email !== email) {
      sendError(res, "You can only reject applications for your own tuitions", 403);
      return;
    }
    const updated = await ApplicationModel.updateStatus(objectId, "rejected");
    sendSuccess(res, updated, "Application rejected successfully");
  }
  // ==================== Get Payments ====================
  static async getPayments(req, res) {
    const { skip, limit, page } = parsePagination(req.query);
    const { email } = req.user;
    const { data: payments, total } = await PaymentModel.findByStudentId(email, { skip, limit });
    sendPaginated(
      res,
      payments,
      page,
      limit,
      total,
      "Payments fetched successfully"
    );
  }
};

// src/features/dashboard/student/routes.ts
import { Router as Router3 } from "express";

// src/shared-types/dashboard/student.ts
var STUDENT_TUITION_ROUTES = {
  ALL: "/tuitions",
  MY: "/tuitions/my",
  BY_ID: (id) => `/tuitions/${id}`,
  CREATE: "/tuitions/create",
  UPDATE: (id) => `/tuitions/${id}/update`,
  DELETE: (id) => `/tuitions/${id}/delete`
};
var STUDENT_APPLICATION_ROUTES = {
  BY_TUITION: (tuitionId) => `/tuitions/${tuitionId}/applications`,
  ACCEPT: (applicationId) => `/applications/${applicationId}/accept`,
  REJECT: (applicationId) => `/applications/${applicationId}/reject`
};
var STUDENT_PAYMENT_ROUTES = {
  ALL: "/payments",
  BY_ID: (id) => `/payments/${id}`
};

// src/features/dashboard/student/routes.ts
var router3 = Router3();
router3.use(authMiddleware, studentMiddleware);
router3.post(
  STUDENT_TUITION_ROUTES.CREATE,
  StudentDashboardController.createTuition
);
router3.get(
  STUDENT_TUITION_ROUTES.ALL,
  StudentDashboardController.getMyTuitions
);
router3.get(
  STUDENT_TUITION_ROUTES.MY,
  StudentDashboardController.getMyTuitions
);
router3.patch(
  STUDENT_TUITION_ROUTES.UPDATE(":id"),
  StudentDashboardController.updateTuition
);
router3.delete(
  STUDENT_TUITION_ROUTES.DELETE(":id"),
  StudentDashboardController.deleteTuition
);
router3.get(
  STUDENT_APPLICATION_ROUTES.BY_TUITION(":tuitionId"),
  StudentDashboardController.getApplicationsForTuition
);
router3.patch(
  STUDENT_APPLICATION_ROUTES.ACCEPT(":id"),
  StudentDashboardController.acceptApplication
);
router3.patch(
  STUDENT_APPLICATION_ROUTES.REJECT(":id"),
  StudentDashboardController.rejectApplication
);
router3.get(
  STUDENT_PAYMENT_ROUTES.ALL,
  StudentDashboardController.getPayments
);
var studentDashboardRouter = router3;

// src/features/dashboard/tutor/controller.ts
var TutorDashboardController = class {
  // ==================== Create Application ====================
  static async createApplication(req, res) {
    const {
      tuitionId,
      qualifications,
      experience,
      expectedSalary,
      coverLetter
    } = req.body;
    const { email, name, picture } = req.user;
    const objectId = toObjectId(tuitionId);
    if (!objectId) {
      sendError(res, "Invalid tuition ID");
      return;
    }
    const tuition = await TuitionModel.findById(objectId);
    if (!tuition) {
      sendNotFound(res, "Tuition not found");
      return;
    }
    if (tuition.status !== "approved") {
      sendError(res, "You can only apply to approved tuitions", 400);
      return;
    }
    const hasApplied = await ApplicationModel.hasApplied(objectId, email);
    if (hasApplied) {
      sendError(res, "You have already applied to this tuition", 400);
      return;
    }
    const application = await ApplicationModel.create({
      tuitionId: objectId,
      tutorId: email,
      tutorEmail: email,
      tutorName: name || "Unknown",
      tutorPhotoUrl: picture,
      qualifications,
      experience,
      expectedSalary: Number(expectedSalary),
      coverLetter
    });
    await TuitionModel.incrementApplicationsCount(objectId);
    sendCreated(res, application, SUCCESS_MESSAGES.APPLICATION_SUBMITTED);
  }
  // ==================== Get My Applications ====================
  static async getMyApplications(req, res) {
    const { skip, limit, page } = parsePagination(req.query);
    const { email } = req.user;
    const { status } = req.query;
    const filter = { tutorId: email };
    if (status) filter.status = status;
    const { data: applications, total } = await ApplicationModel.findByTutorId(
      email,
      { skip, limit }
    );
    sendPaginated(
      res,
      applications,
      page,
      limit,
      total,
      "Your applications fetched successfully"
    );
  }
  // ==================== Get Application by ID ====================
  static async getApplicationById(req, res) {
    const { id } = req.params;
    const { email } = req.user;
    const objectId = toObjectId(id);
    if (!objectId) {
      sendError(res, "Invalid application ID");
      return;
    }
    const application = await ApplicationModel.findById(objectId);
    if (!application) {
      sendNotFound(res, "Application not found");
      return;
    }
    if (application.tutorId !== email) {
      sendError(res, "You can only view your own applications", 403);
      return;
    }
    sendSuccess(res, application, "Application fetched successfully");
  }
  // ==================== Update Application ====================
  static async updateApplication(req, res) {
    const { id } = req.params;
    const { email } = req.user;
    const { qualifications, experience, expectedSalary, coverLetter } = req.body;
    const objectId = toObjectId(id);
    if (!objectId) {
      sendError(res, "Invalid application ID");
      return;
    }
    const isOwner = await ApplicationModel.isOwner(objectId, email);
    if (!isOwner) {
      sendError(res, "You can only update your own applications", 403);
      return;
    }
    const updateData = {};
    if (qualifications !== void 0)
      updateData.qualifications = qualifications;
    if (experience !== void 0) updateData.experience = experience;
    if (expectedSalary !== void 0)
      updateData.expectedSalary = Number(expectedSalary);
    if (coverLetter !== void 0) updateData.coverLetter = coverLetter;
    const application = await ApplicationModel.updateById(objectId, updateData);
    if (!application) {
      sendNotFound(res, "Application not found");
      return;
    }
    sendSuccess(res, application, "Application updated successfully");
  }
  // ==================== Delete Application ====================
  static async deleteApplication(req, res) {
    const { id } = req.params;
    const { email } = req.user;
    const objectId = toObjectId(id);
    if (!objectId) {
      sendError(res, "Invalid application ID");
      return;
    }
    const application = await ApplicationModel.findById(objectId);
    if (!application) {
      sendNotFound(res, "Application not found");
      return;
    }
    if (application.tutorId !== email) {
      sendError(res, "You can only delete your own applications", 403);
      return;
    }
    await ApplicationModel.deleteById(objectId);
    await TuitionModel.decrementApplicationsCount(application.tuitionId);
    sendSuccess(res, null, "Application deleted successfully");
  }
  // ==================== Get Ongoing Tuitions ====================
  static async getOngoingTuitions(req, res) {
    const { skip, limit, page } = parsePagination(req.query);
    const { email } = req.user;
    const { data: applications, total } = await ApplicationModel.findByTutorId(
      email,
      { skip, limit }
    );
    const approvedApplications = applications.filter((app2) => app2.status === "approved");
    const tuitionsWithDetails = await Promise.all(
      approvedApplications.map(async (app2) => {
        const tuition = await TuitionModel.findById(app2.tuitionId);
        return tuition;
      })
    );
    const tuitions = tuitionsWithDetails.filter((t) => t !== null);
    sendPaginated(
      res,
      tuitions,
      page,
      limit,
      tuitions.length,
      "Ongoing tuitions fetched successfully"
    );
  }
  // ==================== Get Earnings ====================
  static async getEarnings(req, res) {
    const { email } = req.user;
    const { data: payments } = await PaymentModel.findByTutorId(email);
    const completedPayments = payments.filter((p) => p.status === "completed");
    const pendingPayments = payments.filter((p) => p.status === "pending");
    const totalEarnings = completedPayments.reduce((sum, p) => sum + (p.tutorEarnings || p.amount), 0);
    const pendingEarnings = pendingPayments.reduce((sum, p) => sum + (p.tutorEarnings || p.amount), 0);
    const paidEarnings = totalEarnings;
    sendSuccess(res, {
      totalEarnings,
      pendingEarnings,
      paidEarnings,
      transactions: payments
    }, "Earnings fetched successfully");
  }
  // ==================== Get Payments ====================
  static async getPayments(req, res) {
    const { skip, limit, page } = parsePagination(req.query);
    const { email } = req.user;
    const { data: payments, total } = await PaymentModel.findByTutorId(email, { skip, limit });
    sendPaginated(
      res,
      payments,
      page,
      limit,
      total,
      "Payments fetched successfully"
    );
  }
};

// src/features/dashboard/tutor/routes.ts
import { Router as Router4 } from "express";

// src/shared-types/dashboard/tutor.ts
var TUTOR_APPLICATION_ROUTES = {
  ALL: "/applications",
  MY: "/applications/my",
  BY_ID: (id) => `/applications/${id}`,
  CREATE: "/applications/create",
  UPDATE: (id) => `/applications/${id}/update`,
  DELETE: (id) => `/applications/${id}/delete`
};
var TUTOR_TUITION_ROUTES = {
  ONGOING: "/tuitions/ongoing"
};
var TUTOR_PAYMENT_ROUTES = {
  EARNINGS: "/earnings",
  HISTORY: "/payments"
};

// src/features/dashboard/tutor/routes.ts
var router4 = Router4();
router4.use(authMiddleware, tutorMiddleware);
router4.post(
  TUTOR_APPLICATION_ROUTES.CREATE,
  TutorDashboardController.createApplication
);
router4.get(
  TUTOR_APPLICATION_ROUTES.ALL,
  TutorDashboardController.getMyApplications
);
router4.get(
  TUTOR_APPLICATION_ROUTES.MY,
  TutorDashboardController.getMyApplications
);
router4.get(
  TUTOR_APPLICATION_ROUTES.BY_ID(":id"),
  TutorDashboardController.getApplicationById
);
router4.patch(
  TUTOR_APPLICATION_ROUTES.UPDATE(":id"),
  TutorDashboardController.updateApplication
);
router4.delete(
  TUTOR_APPLICATION_ROUTES.DELETE(":id"),
  TutorDashboardController.deleteApplication
);
router4.get(
  TUTOR_TUITION_ROUTES.ONGOING,
  TutorDashboardController.getOngoingTuitions
);
router4.get(
  TUTOR_PAYMENT_ROUTES.EARNINGS,
  TutorDashboardController.getEarnings
);
router4.get(
  TUTOR_PAYMENT_ROUTES.HISTORY,
  TutorDashboardController.getPayments
);
var tutorDashboardRouter = router4;

// src/features/dashboard/index.ts
var router5 = Router5();
router5.get(
  PROFILE_ROUTES.GET,
  authMiddleware,
  anyRoleMiddleware,
  SharedDashboardController.getProfile
);
router5.patch(
  PROFILE_ROUTES.UPDATE,
  authMiddleware,
  anyRoleMiddleware,
  SharedDashboardController.updateProfile
);
router5.use("/admin", adminDashboardRouter);
router5.use("/student", studentDashboardRouter);
router5.use("/tutor", tutorDashboardRouter);
var dashboardRouter = router5;

// src/features/public/routes.ts
import { Router as Router6 } from "express";

// src/shared-types/public/index.ts
var PUBLIC_TUITION_ROUTES = {
  ALL: "/tuitions",
  FEATURED: "/tuitions/featured",
  FILTER_OPTIONS: "/tuitions/filter-options",
  BY_ID: (id) => `/tuitions/${id}`,
  SEARCH: "/tuitions/search"
};
var PUBLIC_TUTOR_ROUTES = {
  ALL: "/tutors",
  FEATURED: "/tutors/featured",
  FILTER_OPTIONS: "/tutors/filter-options",
  BY_ID: (id) => `/tutors/${id}`
};

// src/features/public/controller.ts
var PublicController = class {
  // ==================== Get All Tuitions ====================
  static async getTuitions(req, res) {
    const {
      page = "1",
      limit = "10",
      sort = "createdAt",
      order = "desc",
      subject,
      class: className,
      location,
      minBudget,
      maxBudget,
      search
    } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const filter = { status: "approved" };
    if (subject && subject !== "all") filter.subject = { $regex: subject, $options: "i" };
    if (className && className !== "all") filter.class = { $regex: className, $options: "i" };
    if (location && location !== "all") filter.location = { $regex: location, $options: "i" };
    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = parseInt(minBudget, 10);
      if (maxBudget) filter.budget.$lte = parseInt(maxBudget, 10);
    }
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { class: { $regex: search, $options: "i" } }
      ];
    }
    const sortOptions = {
      [sort]: order === "asc" ? 1 : -1
    };
    const { data, total } = await TuitionModel.findAll(filter, {
      skip,
      limit: limitNum
      // sort: sortOptions, 
    });
    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  }
  // ==================== Get Featured Tuitions ====================
  static async getFeaturedTuitions(req, res) {
    const { data } = await TuitionModel.findAll(
      { status: "approved" },
      { limit: 6, sort: { createdAt: -1 } }
    );
    res.json({ success: true, data });
  }
  // ==================== Get Tuition By ID ====================
  static async getTuitionById(req, res) {
    const { id } = req.params;
    const tuition = await TuitionModel.findById(id);
    if (!tuition) {
      res.status(404).json({
        success: false,
        message: "Tuition not found"
      });
      return;
    }
    res.json({ success: true, data: tuition });
  }
  // ==================== Get Filter Options ====================
  static async getFilterOptions(req, res) {
    const filter = { status: "approved" };
    const [classes, subjects, locations] = await Promise.all([
      TuitionModel.getDistinctValues("class", filter),
      TuitionModel.getDistinctValues("subject", filter),
      TuitionModel.getDistinctValues("location", filter)
    ]);
    const classOptions = ["all", ...classes.sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      return numA - numB;
    })];
    const subjectOptions = ["all", ...subjects.sort()];
    const locationOptions = ["all", ...locations.sort()];
    res.json({
      success: true,
      data: {
        classes: classOptions,
        subjects: subjectOptions,
        locations: locationOptions
      }
    });
  }
  // ==================== Get All Tutors ====================
  static async getTutors(req, res) {
    const {
      page = "1",
      limit = "10",
      sort = "createdAt",
      order = "desc",
      subject,
      location,
      experience,
      search
    } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const filter = { role: "tutor", status: "active" };
    if (subject && subject !== "all") {
      filter.subjects = { $regex: subject, $options: "i" };
    }
    if (location && location !== "all") {
      filter.location = { $regex: location, $options: "i" };
    }
    if (experience && experience !== "all") {
      const experienceNum = parseInt(experience.split("-")[0] || "0", 10);
      filter.experience = { $gte: experienceNum.toString() };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { subjects: { $regex: search, $options: "i" } },
        { qualifications: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } }
      ];
    }
    const sortOptions = {
      [sort]: order === "asc" ? 1 : -1
    };
    const { data, total } = await UserModel.findTutors(filter, {
      skip,
      limit: limitNum
      // sort: sortOptions,
    });
    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  }
  // ==================== Get Featured Tutors ====================
  static async getFeaturedTutors(req, res) {
    const { data } = await UserModel.findTutors(
      { status: "active" },
      { limit: 6 }
    );
    res.json({ success: true, data });
  }
  // ==================== Get Tutor By ID ====================
  static async getTutorById(req, res) {
    const { id } = req.params;
    const tutor = await UserModel.findById(id);
    if (!tutor || tutor.role !== "tutor") {
      res.status(404).json({
        success: false,
        message: "Tutor not found"
      });
      return;
    }
    res.json({ success: true, data: tutor });
  }
  // ==================== Get Tutor Filter Options ====================
  static async getTutorFilterOptions(req, res) {
    const filter = { role: "tutor", status: "active" };
    const [subjects, locations] = await Promise.all([
      UserModel.getDistinctValues("subjects", filter),
      UserModel.getDistinctValues("location", filter)
    ]);
    const subjectOptions = ["all", ...subjects.sort()];
    const locationOptions = ["all", ...locations.filter(Boolean).sort()];
    const experienceOptions = ["all", "0-1", "1-2", "3-5", "5+"];
    res.json({
      success: true,
      data: {
        subjects: subjectOptions,
        locations: locationOptions,
        experience: experienceOptions
      }
    });
  }
};

// src/features/public/routes.ts
var router6 = Router6();
router6.get(
  PUBLIC_TUITION_ROUTES.ALL,
  optionalAuth,
  asyncHandler(PublicController.getTuitions)
);
router6.get(
  PUBLIC_TUITION_ROUTES.FEATURED,
  asyncHandler(PublicController.getFeaturedTuitions)
);
router6.get(
  PUBLIC_TUITION_ROUTES.FILTER_OPTIONS,
  asyncHandler(PublicController.getFilterOptions)
);
router6.get(
  PUBLIC_TUITION_ROUTES.BY_ID(":id"),
  optionalAuth,
  asyncHandler(PublicController.getTuitionById)
);
router6.get(
  PUBLIC_TUTOR_ROUTES.ALL,
  optionalAuth,
  asyncHandler(PublicController.getTutors)
);
router6.get(
  PUBLIC_TUTOR_ROUTES.FEATURED,
  asyncHandler(PublicController.getFeaturedTutors)
);
router6.get(
  PUBLIC_TUTOR_ROUTES.FILTER_OPTIONS,
  asyncHandler(PublicController.getTutorFilterOptions)
);
router6.get(
  PUBLIC_TUTOR_ROUTES.BY_ID(":id"),
  optionalAuth,
  asyncHandler(PublicController.getTutorById)
);
var routes_default2 = router6;

// src/features/reviews/routes.ts
import { Router as Router7 } from "express";

// src/shared-types/reviews/validators.ts
import { z as z2 } from "zod";
var CreateReviewSchema = z2.object({
  tutorId: z2.string().min(1, "Tutor ID is required"),
  rating: z2.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z2.string().min(5, "Comment must be at least 5 characters").max(500, "Comment cannot exceed 500 characters")
});
var UpdateReviewSchema = z2.object({
  rating: z2.number().int().min(1).max(5).optional(),
  comment: z2.string().min(5).max(500).optional()
});

// src/shared-types/reviews/index.ts
var REVIEW_ROUTES = {
  CREATE: "/reviews",
  GET_BY_TUTOR: (tutorId) => `/reviews/tutor/${tutorId}`,
  GET_STUDENT_REVIEW: (tutorId, studentId) => `/reviews/tutor/${tutorId}/student/${studentId}`,
  UPDATE: (reviewId) => `/reviews/${reviewId}`,
  DELETE: (reviewId) => `/reviews/${reviewId}`
};

// src/features/reviews/controller.ts
var ReviewController = class {
  // ==================== Create Review ====================
  static async createReview(req, res) {
    try {
      const { tutorId, rating, comment } = req.body;
      const studentId = req.user?.email;
      if (!studentId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const tutor = await UserModel.findById(tutorId);
      if (!tutor) {
        sendNotFound(res, "Tutor not found");
        return;
      }
      const student = await UserModel.findByEmail(studentId);
      if (!student) {
        sendNotFound(res, "Student not found");
        return;
      }
      const existingReview = await ReviewModel.findByTutorAndStudent(tutorId, studentId);
      if (existingReview) {
        res.status(409).json({ error: "You have already reviewed this tutor" });
        return;
      }
      const review = await ReviewModel.create({
        tutorId,
        studentId,
        studentName: student.name || "Anonymous",
        studentPhoto: student.photoUrl || void 0,
        rating,
        comment,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      sendCreated(res, { review });
    } catch (error) {
      sendError(res, "Failed to create review", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
  // ==================== Get Reviews by Tutor ====================
  static async getReviewsByTutor(req, res) {
    try {
      const { tutorId } = req.params;
      const skip = parseInt(req.query.skip) || 0;
      const limit = parseInt(req.query.limit) || 10;
      const tutor = await UserModel.findById(tutorId);
      if (!tutor) {
        sendNotFound(res, "Tutor not found");
        return;
      }
      const { data, total } = await ReviewModel.findByTutor(tutorId, { skip, limit });
      const reviews = data.map((review) => ({
        _id: review._id?.toString(),
        student: {
          name: review.studentName,
          photo: review.studentPhoto
        },
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt?.toISOString()
      }));
      sendSuccess(res, { reviews, total, skip, limit });
    } catch (error) {
      sendError(res, "Failed to fetch reviews", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
  // ==================== Get Student's Review for Tutor ====================
  static async getStudentReview(req, res) {
    try {
      const { tutorId, studentId } = req.params;
      const review = await ReviewModel.findByTutorAndStudent(tutorId, studentId);
      if (!review) {
        sendNotFound(res, "Review not found");
        return;
      }
      const formattedReview = {
        _id: review._id?.toString(),
        student: {
          name: review.studentName,
          photo: review.studentPhoto
        },
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt?.toISOString()
      };
      sendSuccess(res, { review: formattedReview });
    } catch (error) {
      sendError(res, "Failed to fetch review", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
  // ==================== Update Review ====================
  static async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { rating, comment } = req.body;
      const studentId = req.user?.email;
      if (!studentId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const review = await ReviewModel.findById(reviewId);
      if (!review) {
        sendNotFound(res, "Review not found");
        return;
      }
      if (review.studentId !== studentId) {
        res.status(403).json({ error: "You can only update your own review" });
        return;
      }
      const updatedReview = await ReviewModel.updateById(reviewId, {
        rating: rating !== void 0 ? rating : review.rating,
        comment: comment !== void 0 ? comment : review.comment
      });
      sendSuccess(res, { review: updatedReview });
    } catch (error) {
      sendError(res, "Failed to update review", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
  // ==================== Delete Review ====================
  static async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      const studentId = req.user?.email;
      if (!studentId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const review = await ReviewModel.findById(reviewId);
      if (!review) {
        sendNotFound(res, "Review not found");
        return;
      }
      if (review.studentId !== studentId) {
        res.status(403).json({ error: "You can only delete your own review" });
        return;
      }
      const deleted = await ReviewModel.deleteById(reviewId);
      if (!deleted) {
        sendNotFound(res, "Review not found");
        return;
      }
      sendSuccess(res, { message: "Review deleted successfully" });
    } catch (error) {
      sendError(res, "Failed to delete review", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
  // ==================== Get Tutor Rating Stats ====================
  static async getTutorRatingStats(req, res) {
    try {
      const { tutorId } = req.params;
      const tutor = await UserModel.findById(tutorId);
      if (!tutor) {
        sendNotFound(res, "Tutor not found");
        return;
      }
      const avgRating = await ReviewModel.getAverageRating(tutorId);
      const reviewCount = await ReviewModel.getReviewCount(tutorId);
      sendSuccess(res, { avgRating, reviewCount });
    } catch (error) {
      sendError(res, "Failed to fetch rating stats", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
};

// src/features/reviews/routes.ts
var router7 = Router7();
router7.post(
  REVIEW_ROUTES.CREATE,
  authMiddleware,
  validateBody(CreateReviewSchema),
  asyncHandler(ReviewController.createReview)
);
router7.get(
  REVIEW_ROUTES.GET_BY_TUTOR(":tutorId"),
  asyncHandler(ReviewController.getReviewsByTutor)
);
router7.get(
  REVIEW_ROUTES.GET_STUDENT_REVIEW(":tutorId", ":studentId"),
  asyncHandler(ReviewController.getStudentReview)
);
router7.put(
  REVIEW_ROUTES.UPDATE(":reviewId"),
  authMiddleware,
  validateBody(UpdateReviewSchema),
  asyncHandler(ReviewController.updateReview)
);
router7.delete(
  REVIEW_ROUTES.DELETE(":reviewId"),
  authMiddleware,
  asyncHandler(ReviewController.deleteReview)
);
router7.get(
  `/tutors/:tutorId/rating-stats`,
  asyncHandler(ReviewController.getTutorRatingStats)
);

// src/features/auth/routes.ts
import { Router as Router8 } from "express";

// src/features/auth/controller.ts
import jwt2 from "jsonwebtoken";
import bcrypt from "bcrypt";
var AuthController = class {
  // ==================== Register ====================
  static async signUp(req, res) {
    const { name, email, phone, role, password } = req.body;
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      sendError(res, "Email already registered. Please login.", HTTP_STATUS.CONFLICT);
      return;
    }
    const newUser = await UserModel.create({ email, name, phone, role, password, status: "active", createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() });
    const token = jwt2.sign(
      { email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3
    });
    sendCreated(res, { user: { email, name, phone, role } }, "User registered successfully");
  }
  // ==================== Login ====================
  static async signIn(req, res) {
    const { email, password } = req.body;
    const user = await UserModel.findByEmail(email);
    console.log(user);
    if (!user) {
      sendError(res, "Invalid email or password.", HTTP_STATUS.UNAUTHORIZED);
      return;
    }
    if (user.status === "banned") {
      sendError(res, "Your account has been banned.", HTTP_STATUS.FORBIDDEN);
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      sendError(res, "Invalid email or password.", HTTP_STATUS.UNAUTHORIZED);
      return;
    }
    const { name, phone, role } = user;
    const token = jwt2.sign(
      { email, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3
    });
    sendSuccess(res, { user: { name, email, phone, role } }, "Login successful");
  }
  static async signInWithGooglePopup(req, res) {
    try {
      console.log("\u{1F50D} Google sign-in attempt started");
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("\u274C No Bearer token found");
        sendError(res, "No Google token provided.", HTTP_STATUS.BAD_REQUEST);
        return;
      }
      const token = authHeader.split(" ")[1];
      console.log("\u2705 Token extracted, token length:", token?.length);
      if (!token) {
        console.log("\u274C Token is empty");
        sendError(res, "Invalid token format.", HTTP_STATUS.BAD_REQUEST);
        return;
      }
      const decodedToken = await firebase.verifyToken(token);
      const { email, name } = decodedToken;
      if (!email) {
        console.log("\u274C No email in token");
        sendError(res, "Token does not contain an email.", HTTP_STATUS.BAD_REQUEST);
        return;
      }
      let user = await UserModel.findByEmail(email);
      if (!user) {
        console.log("\u{1F50D} Creating new user for:", email);
        user = await UserModel.create({
          name: name || "Guest",
          email,
          role: "student",
          status: "active",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
        console.log("\u2705 New user created:", user._id);
      } else {
        console.log("\u2705 Existing user found:", email);
      }
      const jwtToken = jwt2.sign(
        { email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      console.log("\u2705 JWT generated");
      res.cookie("auth_token", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1e3
      });
      sendSuccess(res, { user: { name: user.name, email: user.email, role: user.role } }, "Google sign-in successful");
      console.log("\u2705 Response sent successfully");
    } catch (error) {
      console.error("\u274C Google sign-in error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("\u274C Error details:", errorMsg);
      const isDev = process.env.NODE_ENV !== "production";
      const responseMsg = isDev ? `Google sign-in failed: ${errorMsg}` : "Google sign-in failed. Please try again.";
      sendError(res, responseMsg, HTTP_STATUS.UNAUTHORIZED);
    }
  }
  // ==================== Logout ====================
  static async signOut(_req, res) {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });
    sendSuccess(res, null, "Logout successful");
  }
  // ==================== Get Current User (Me) ====================
  static async getMe(req, res) {
    const user = await UserModel.findByEmail(req.user.email);
    if (!user) {
      sendNotFound(res, "User not found");
      return;
    }
    const { name, email, phone, role } = user;
    sendSuccess(res, { user: { name, email, phone, role } }, "User fetched successfully");
  }
};

// src/features/auth/routes.ts
var router8 = Router8();
router8.post(
  AUTH_ROUTES.SIGNUP,
  guestMiddleware,
  validateBody(SignUpSchema),
  asyncHandler(AuthController.signUp)
);
router8.post(
  AUTH_ROUTES.SIGNIN,
  guestMiddleware,
  asyncHandler(AuthController.signIn)
);
router8.post(
  AUTH_ROUTES.GOOGLE,
  guestMiddleware,
  asyncHandler(AuthController.signInWithGooglePopup)
);
router8.post(
  AUTH_ROUTES.SIGNOUT,
  authMiddleware,
  asyncHandler(AuthController.signOut)
);
router8.get(
  AUTH_ROUTES.ME,
  authMiddleware,
  asyncHandler(AuthController.getMe)
);
var routes_default3 = router8;

// src/index.ts
firebase.init();
var app = express();
app.use(helmet());
app.use(compression());
app.use(async (req, res, next) => {
  try {
    await db.connect();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});
var allowedOrigins = [
  getEnv.string("CLIENT_URL", "http://localhost:3000"),
  "https://e-tuitionbd.netlify.app",
  "http://localhost:3000",
  "http://localhost:5173"
].map((url) => url.replace(/\/$/, ""));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.some((allowed) => normalizedOrigin === allowed)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
var requestCounter = 0;
var requestLog = {};
app.use((req, res, next) => {
  requestCounter++;
  const endpoint = `${req.method} ${req.path}`;
  requestLog[endpoint] = (requestLog[endpoint] || 0) + 1;
  const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
  console.log(`[${timestamp}] #${requestCounter} ${endpoint} (${requestLog[endpoint]}x)`);
  next();
});
var API_BASE = "/api/v1";
app.use(API_BASE, routes_default3);
app.use(API_BASE, routes_default2);
app.use(API_BASE, dashboardRouter);
app.use(API_BASE, router7);
app.use(API_BASE, routes_default);
app.use(notFoundHandler);
app.use(errorHandler);
if (process.env.VERCEL !== "1") {
  await Server.start(app);
}
var index_default = app;
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
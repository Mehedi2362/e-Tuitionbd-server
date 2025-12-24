// ==================== Payment Controller ====================
import type { Response } from "express";
import Stripe from "stripe";
import { config } from "../../config/index.js";
import {
  parsePagination,
  sendCreated,
  sendError,
  sendNotFound,
  sendPaginated,
  sendSuccess,
  toObjectId,
} from "../../shared/utils/index.js";
import {
  ApplicationModel,
  TuitionModel,
  PaymentModel,
} from "../../shared/models/index.js";
import type { AuthRequest } from "../auth/types.js";

// Initialize Stripe
const stripe = new Stripe(config.stripeSecretKey);

// ==================== Payment Controller Class ====================
export class PaymentController {
  // ==================== Create Checkout Session ====================
  static async createCheckoutSession(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    const { applicationId } = req.body;
    const { email } = req.user!;

    const appObjectId = toObjectId(applicationId);
    if (!appObjectId) {
      sendError(res, "Invalid application ID");
      return;
    }

    // Get application
    const application = await ApplicationModel.findById(appObjectId);
    if (!application) {
      sendNotFound(res, "Application not found");
      return;
    }

    // Get tuition
    const tuition = await TuitionModel.findById(application.tuitionId);
    if (!tuition) {
      sendNotFound(res, "Tuition not found");
      return;
    }

    // Verify ownership
    if (tuition.student.email !== email) {
      sendError(res, "You can only pay for your own tuitions", 403);
      return;
    }

    // Verify application is approved
    if (application.status !== "approved") {
      sendError(res, "Application must be approved before payment", 400);
      return;
    }

    // Create payment record
    const payment = await PaymentModel.create({
      applicationId: appObjectId,
      tuitionId: application.tuitionId,
      studentId: email,
      tutorId: application.tutorId,
      amount: application.expectedSalary,
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `Tuition: ${tuition.subject}`,
              description: `Tutor: ${application.tutorName}`,
            },
            unit_amount: application.expectedSalary * 100, // Convert to paisa
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${config.clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.clientUrl}/payment/cancel`,
      metadata: {
        paymentId: payment._id!.toString(),
        applicationId: applicationId,
      },
    });

    // Update payment with session ID
    await PaymentModel.updateById(payment._id!, {
      stripeSessionId: session.id,
    });

    sendCreated(
      res,
      { sessionId: session.id, url: session.url },
      "Checkout session created"
    );
  }

  // ==================== Verify Payment ====================
  static async verifyPayment(req: AuthRequest, res: Response): Promise<void> {
    const { sessionId } = req.params;

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      sendNotFound(res, "Session not found");
      return;
    }

    // Find payment by session ID
    const payment = await PaymentModel.findBySessionId(sessionId);

    if (!payment) {
      sendNotFound(res, "Payment not found");
      return;
    }

    // Update payment status if completed
    if (session.payment_status === "paid" && payment.status !== "completed") {
      await PaymentModel.markCompleted(payment._id!);

      // Update application status to completed
      await ApplicationModel.updateStatus(payment.applicationId, "completed");

      // Update tuition status to completed
      await TuitionModel.updateStatus(payment.tuitionId, "completed");
    }

    const updatedPayment = await PaymentModel.findById(payment._id!);

    sendSuccess(res, updatedPayment, "Payment verified successfully");
  }

  // ==================== Get My Payments (Student) ====================
  static async getMyPayments(req: AuthRequest, res: Response): Promise<void> {
    const { skip, limit, page } = parsePagination(req.query);
    const { email } = req.user!;

    const { data: payments, total } = await PaymentModel.findByStudentId(email, {
      skip,
      limit,
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
  static async getTutorEarnings(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    const { skip, limit, page } = parsePagination(req.query);
    const { email } = req.user!;

    const [{ data: payments, total }, totalEarnings] = await Promise.all([
      PaymentModel.findByTutorId(email, { skip, limit }),
      PaymentModel.getTutorEarnings(email),
    ]);

    sendSuccess(
      res,
      {
        payments,
        totalEarnings,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      "Earnings fetched successfully"
    );
  }

  // ==================== Get All Payments (Admin) ====================
  static async getAllPayments(req: AuthRequest, res: Response): Promise<void> {
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
  static async getById(req: AuthRequest, res: Response): Promise<void> {
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
}

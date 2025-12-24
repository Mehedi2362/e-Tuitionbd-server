import { z } from "zod";

export type SignInCreds = z.infer<typeof SignInSchema>
export const SignInSchema = z.object({
    email: z.email({ message: "Email is required" }),

    password: z.string().min(8, "Password must be at least 8 characters")
})

export type SignUpCreds = z.infer<typeof SignUpSchema>
export const SignUpSchema = z.object({
    name: z.string()
        .min(1, "Name is required")
        .max(50, "Name must be at most 50 characters"),

    email: z.email({ message: "Email is required" }),

    phone: z.string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number must be at most 15 digits")
        .regex(/^01[3-9][0-9]{8}$/, "Phone number must contain only digits"),

    role: z.enum(["student", "tutor"], {
        message: "Role is required and must be student or tutor",
    }),

    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),

    confirmPassword: z.string()
        .min(1, "Please confirm your password"),

}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

# eTuitionBd - Server

> Backend API for বাংলাদেশের সেরা অনলাইন টিউশন ম্যানেজমেন্ট প্ল্যাটফর্ম

A robust Express.js API server for the eTuitionBd tutoring platform with MongoDB, Firebase integration, and Stripe payments.

## 🚀 Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Firebase email/password and OAuth support
- Role-based access control (Student, Tutor, Admin)
- Secure token management
- Protected API endpoints

### 👨‍🎓 Student Features

- Create and manage tuition posts
- Track applications from tutors
- Payment processing and history
- Profile management
- Review tutoring sessions

### 👨‍🏫 Tutor Features

- Browse and apply to tuition posts
- Manage ongoing tuitions
- Track earnings and revenue
- Profile with ratings and reviews
- Submit payout requests

### 👑 Admin Features

- User management (approve/suspend)
- Tuition post moderation
- Payment and revenue analytics
- Platform statistics and reports
- Content management

### 💳 Payment Integration

- Stripe payment processing
- Secure transaction handling
- Invoice and receipt generation
- Payment history tracking

### 📊 Public Features

- Tuition listings with search and filters
- Tutor directory with ratings
- User reviews and testimonials
- Platform statistics

## 🛠️ Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** Firebase Admin SDK + JWT
- **Payment:** Stripe API
- **Validation:** Zod
- **Error Handling:** Custom middleware
- **Deployment:** Vercel

## 📦 Installation

### Prerequisites

- Node.js 18+
- pnpm package manager
- MongoDB Atlas account
- Firebase project
- Stripe account

### Setup Steps

1. **Clone and install:**

   ```bash
   pnpm install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:

   ```env
   # MongoDB
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=AppName
   DB_NAME=database_name

   # JWT
   JWT_SECRET=your-secure-jwt-secret-key-change-in-production

   # Firebase Admin SDK (Base64 encoded JSON)
   FIREBASE_ADMIN_SDK_JSON=your-firebase-config-json-base64-encoded

   # Stripe
   STRIPE_SECRET_KEY=sk_test_your_test_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here

   # Client URL
   CLIENT_URL=http://localhost:3000
   ```

3. **Start development server:**

   ```bash
   pnpm dev
   ```

   Server runs on `http://localhost:5000`

## 🔧 Available Scripts

```bash
pnpm dev              # Start with hot reload (tsx watch)
pnpm start            # Start production build
pnpm build            # Build TypeScript to dist/
pnpm build:tsc        # Build with tsc compiler
pnpm type-check       # Check TypeScript types
pnpm lint             # Run ESLint
```

## 📁 Project Structure

```
server/
├── src/
│   ├── index.ts                 # Entry point
│   ├── config/                  # Configuration
│   │   ├── app.config.ts       # Express app setup
│   │   ├── server.ts           # Server initialization
│   │   ├── db.ts               # MongoDB connection
│   │   └── firebase.ts         # Firebase setup
│   ├── features/                # Feature modules
│   │   ├── auth/               # Authentication
│   │   │   ├── controller.ts
│   │   │   ├── routes.ts
│   │   │   ├── middleware.ts
│   │   │   ├── types.ts
│   │   │   └── constant.ts
│   │   ├── dashboard/          # Dashboard (student/tutor/admin)
│   │   │   ├── shared.controller.ts
│   │   │   ├── student/
│   │   │   ├── tutor/
│   │   │   └── admin/
│   │   ├── payments/           # Payment processing
│   │   │   ├── controller.ts
│   │   │   ├── routes.ts
│   │   │   ├── model.ts
│   │   │   ├── types.ts
│   │   │   └── constants.ts
│   │   ├── public/             # Public endpoints
│   │   │   ├── controller.ts
│   │   │   └── routes.ts
│   │   └── reviews/            # Review management
│   │       ├── controller.ts
│   │       └── routes.ts
│   └── shared/                  # Shared utilities
│       ├── middleware/          # Global middleware
│       │   ├── error.ts        # Error handling
│       │   ├── validate.ts     # Validation
│       │   └── index.ts
│       ├── models/              # MongoDB schemas
│       │   ├── application.model.ts
│       │   ├── user.model.ts
│       │   ├── tuition.model.ts
│       │   ├── payment.model.ts
│       │   └── index.ts
│       ├── types/               # TypeScript types
│       ├── utils/               # Utility functions
│       └── constants/           # Global constants
├── dist/                        # Compiled JavaScript
├── scripts/                     # Utility scripts
│   ├── create-admin.ts
│   └── seed-tutors.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts              # Build configuration
└── vercel.json                 # Vercel deployment config
```

## 🔐 Environment Variables

Required environment variables in `.env`:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=App
DB_NAME=database_name

# JWT Configuration
JWT_SECRET=super-secure-jwt-secret-key-for-development-change-in-production

# Firebase Admin SDK
# Get this from Firebase Console > Project Settings > Service Accounts
# Encode the JSON as Base64 and paste here
FIREBASE_ADMIN_SDK_JSON=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAieW91ci1wcm9qZWN0LWlkIiwKICAuLi4KfQ==

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Client URL (for CORS and redirects)
CLIENT_URL=http://localhost:3000
```

## 🔌 API Routes

### Authentication (`/api/v1/auth`)

- `POST /signup` - Register new user
- `POST /login` - Login user
- `POST /refresh-token` - Refresh JWT token
- `POST /logout` - Logout user

### Public (`/api/v1/public`)

- `GET /tuitions` - List tuitions
- `GET /tuitions/:id` - Get tuition details
- `GET /tutors` - List tutors
- `GET /tutors/:id` - Get tutor profile
- `GET /tutors/:id/reviews` - Get tutor reviews

### Dashboard (`/api/v1/dashboard`)

**Student:**

- `GET /student/tuitions` - My tuitions
- `POST /student/tuitions` - Create tuition
- `PUT /student/tuitions/:id` - Update tuition
- `DELETE /student/tuitions/:id` - Delete tuition
- `GET /student/applications` - My applications

**Tutor:**

- `GET /tutor/applications` - My applications
- `POST /tutor/applications/:id/apply` - Apply to tuition
- `GET /tutor/ongoing` - Ongoing tuitions
- `GET /tutor/revenue` - Revenue information

**Admin:**

- `GET /admin/users` - Manage users
- `GET /admin/tuitions` - Moderate tuitions
- `PUT /admin/tuitions/:id/approve` - Approve tuition
- `PUT /admin/tuitions/:id/reject` - Reject tuition
- `GET /admin/analytics` - Platform statistics

### Payments (`/api/v1/payments`)

- `POST /create-checkout-session` - Create Stripe checkout
- `POST /webhook` - Stripe webhook handler
- `GET /history` - Payment history
- `GET /:id` - Payment details

### Reviews (`/api/v1/reviews`)

- `POST /` - Create review
- `GET /tutor/:id` - Get tutor reviews
- `PUT /:id` - Update review
- `DELETE /:id` - Delete review

## 🔒 Authentication Flow

1. User signs up/logs in via Firebase
2. Firebase returns ID token
3. Server validates token and creates JWT
4. JWT stored in HTTP-only cookie
5. Subsequent requests include JWT for authentication
6. Routes check JWT and user role

## 💳 Payment Processing

1. Client requests checkout session
2. Server creates Stripe checkout
3. User completes payment on Stripe
4. Stripe webhook notifies server
5. Server updates payment status
6. Client receives confirmation

## 🚀 Deployment

### Vercel

1. **Build:**

   ```bash
   pnpm build
   ```

2. **Connect repository** to Vercel

3. **Set environment variables** in Vercel dashboard:

   - All variables from `.env`
   - `MONGODB_URI` for production database
   - `STRIPE_SECRET_KEY` (production key)
   - Update `CLIENT_URL` to production client URL

4. **Deploy:**
   ```bash
   vercel --prod
   ```

### Production Checklist

- [ ] Update `JWT_SECRET` to strong random value
- [ ] Use production MongoDB URI
- [ ] Configure production Stripe keys
- [ ] Update `CLIENT_URL` to production domain
- [ ] Enable HTTPS
- [ ] Setup error logging and monitoring
- [ ] Configure CORS for production domains
- [ ] Setup database backups
- [ ] Configure rate limiting
- [ ] Enable request validation

## 🧪 Development Commands

### Create Admin User

```bash
tsx scripts/create-admin.ts
```

### Seed Tutors

```bash
tsx scripts/seed-tutors.ts
```

## 🐛 Error Handling

All errors are handled through custom middleware that:

- Catches and formats errors
- Returns appropriate HTTP status codes
- Logs errors for debugging
- Prevents sensitive information leaks

## 📊 Database Schema

### User

```typescript
{
  uid: string;        // Firebase UID
  email: string;
  name: string;
  role: 'student' | 'tutor' | 'admin';
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Tuition

```typescript
{
  studentId: string;
  subject: string;
  level: string;
  location: string;
  budget: number;
  description: string;
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔗 Related Repositories

- **Client:** [e-Tuitionbd-client](https://github.com/Mehedi2362/e-Tuitionbd-client)
- **Server:** [e-Tuitionbd-server](https://github.com/Mehedi2362/e-Tuitionbd-server)

## 📝 License

MIT

## 👥 Author

B12-A11 Project Team

---

For issues or questions, please open an issue on GitHub.

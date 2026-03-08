# 🎫 BuddyTickets

A full-stack event ticketing marketplace built with Next.js 16 and Supabase PostgreSQL, targeting the Sri Lankan market. Features custom authentication with OTP email verification, real-time ticket reservations with optimistic concurrency control, PayHere payment integration, organizer KYC onboarding, QR-based gate entry, and role-based dashboards.

---

## ✨ Features

### Event Discovery
- Animated landing page with category-based browsing (Concerts, Conferences, Workshops, Sports, Arts, Technology)
- Featured events carousel highlighting active and upcoming events
- Event detail pages with image galleries, ticket type breakdowns, and organizer info

### Ticket Purchasing
- Multi-ticket-type selection per event with real-time quantity tracking
- Reservation system with time-limited holds and automatic expiration
- Optimistic concurrency control (OCC) to prevent overselling
- Promo code / coupon support with percentage and fixed-amount discounts
- Server-side price recomputation to prevent client tampering

### Payments
- **PayHere** integration (Sri Lanka's payment gateway) with sandbox and production modes
- **Bank transfer** option with displayed account details
- Webhook-based payment verification with MD5 signature validation
- Idempotent order finalization to handle duplicate webhook deliveries

### Authentication & Security
- Custom auth system (no Supabase Auth) using raw database tables
- Email verification with 6-digit OTP and progressive resend cooldowns
- Password hashing with bcryptjs and HMAC pepper
- JWT sessions stored in httpOnly `bt_session` cookies (HS256, 24h TTL)
- Forgot password flow with OTP verification and time-limited reset tokens

### User Accounts
- Profile management with avatar upload (5 MB limit, strict MIME validation)
- Personal ticket wallet with issued ticket history
- Password change with current-password verification

### Organizer Onboarding
- 4-step KYC process: authenticate → request role via WhatsApp → submit identity & bank details → await approval
- NIC validation (Sri Lankan old and new formats)
- Document upload for NIC front/back images
- Approval status tracking (PENDING → APPROVED / REJECTED with resubmission)

### Role-Based Dashboards
- **System** — platform administration
- **Organizer** — event and sales management
- **Co-Organizer** — collaborative event management
- **Staff** — gate entry and ticket scanning tools

### QR Code Gate Entry
- HMAC-SHA256 tamper-proof QR hashes per ticket
- Timing-safe verification to prevent timing attacks
- Scan audit logging for accountability

### Infrastructure
- Maintenance mode toggle via environment variable
- Route protection middleware with JWT verification and role-based access
- Structured logging for server actions
- HTML-escaped email templates to prevent XSS

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Server Actions) |
| **Language** | TypeScript 5 (strict mode) |
| **Database** | Supabase PostgreSQL (21 tables, RPCs, triggers, views) |
| **Query Layer** | Supabase REST API via `@supabase/supabase-js` |
| **Session** | JWT via `jose` in httpOnly cookies |
| **Passwords** | `bcryptjs` with HMAC pepper |
| **Email** | `nodemailer` (Gmail SMTP) |
| **Payments** | PayHere gateway + bank transfer |
| **Styling** | Tailwind CSS 4, PostCSS |
| **UI Components** | Radix UI primitives, CVA variants |
| **Animations** | Framer Motion, GSAP |
| **Icons** | Lucide React |
| **Toasts** | Sonner |
| **QR Codes** | HMAC-SHA256 hash generation |
| **Timezone** | Asia/Colombo (UTC+5:30) |
| **Currency** | LKR (Sri Lankan Rupee) |

---

## 🗄 Database Schema

The PostgreSQL schema spans **21 tables** with stored procedures, triggers, and views.

### Core Tables

| Group | Tables |
|-------|--------|
| **Users** | `users`, `organizer_details`, `otp_records`, `auth_flow_tokens` |
| **Events** | `categories`, `events`, `event_images`, `ticket_types`, `vip_events` |
| **Orders** | `ticket_reservations`, `orders`, `transactions`, `tickets`, `scan_logs` |
| **Promotions** | `promotions`, `promotion_usages` |
| **Financial** | `payouts`, `refund_requests` |
| **Community** | `event_community`, `waitlists`, `reviews` |

### Key Database Features
- **Stored Procedures**: `reserve_tickets_occ()` (OCC reservation), `finalize_order_tickets()` (atomic order completion), `expire_stale_reservations()` (cleanup)
- **Views**: `view_featured_events`, `view_user_tickets`, `view_event_summary`
- **Triggers**: Auto-updated `updated_at` timestamps on all tables
- **Enum Types**: `user_role`, `organizer_status`, `event_status`, `discount_type`, `reservation_status`, `payment_source`, `payment_status`

---

## 🔐 Authentication Flows

### Sign-Up
1. User fills out the registration form at `/sign-up`
2. Server validates inputs, checks email/mobile uniqueness, hashes password
3. Generates OTP, stores hashed OTP in `otp_records`, creates `auth_flow_token`
4. Sends OTP via email → redirects to `/verify-email?token=xxx`
5. User enters OTP → email verified → redirected to `/sign-in`

### Sign-In
1. User enters credentials at `/sign-in`
2. Server validates email + password
3. **If email not verified:** generates new OTP → redirects to `/verify-email?token=xxx`
4. **If email verified:** creates JWT session → redirects to home

### Forgot Password
1. User enters email at `/forget-password`
2. Server creates OTP → redirects to `/verify-email?token=xxx`
3. User verifies OTP → receives reset token → redirected to `/forget-password?step=reset&token=xxx`
4. User enters new password → password updated → redirected to `/sign-in`

### OTP Progressive Resend Delays

| Attempt | Cooldown |
|---------|----------|
| 1st | 60 seconds |
| 2nd | 2 minutes |
| 3rd | 5 minutes |
| 4th | 15 minutes |
| 5th | 1 hour |
| 6th+ | 24 hours |

- Timer dynamically formats: `59s` → `2m 10s` → `1h 5m` → `1d 2h`
- Resend button disabled during cooldown
- State persisted in database (`otp_records.resend_count`, `last_sent_at`)
- Max 5 verification attempts per OTP before invalidation

---

## 🛡 Route Protection

Route protection is handled in `src/proxy.ts` using JWT session verification.

| Route | Rule |
|-------|------|
| `/profile`, `/tickets`, `/become-an-organizer` | Requires authentication |
| `/checkout/*` | Requires authentication (prefix match) |
| `/dashboard/*` | Requires authentication + role (`SYSTEM`, `ORGANIZER`, `CO_ORGANIZER`, or `STAFF`) |
| `/sign-in`, `/sign-up`, `/forget-password` | Authenticated users redirected to `/` |
| `/verify-email`, `/reset-password` | Requires valid `?token=` query parameter |
| `/maintenance` | Only accessible when `MAINTENANCE_MODE=true` |

---

## 🧭 Application Routes

### Public Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page with hero section, category pills, and featured events |
| `/events` | Browse all on-sale events |
| `/events/[eventId]` | Event details with images, ticket types, and organizer info |
| `/sign-up` | User registration |
| `/sign-in` | User login |
| `/forget-password` | Password reset initiation |
| `/verify-email` | OTP verification (token-protected) |
| `/reset-password` | New password entry (token-protected) |

### Protected Pages
| Route | Description |
|-------|-------------|
| `/events/[eventId]/buy-tickets` | Ticket type selection and quantity picker |
| `/checkout/[reservationId]` | Order summary with promo code and payment method selection |
| `/checkout/success` | Order confirmation page |
| `/checkout/cancel` | Payment cancellation page |
| `/account/profile` | Profile editing with avatar upload |
| `/account/tickets` | Personal ticket wallet |
| `/become-an-organizer` | 4-step organizer KYC onboarding |
| `/dashboard` | Role-based dashboard (system / organizer / staff) |

### API Routes
| Route | Description |
|-------|-------------|
| `/api/webhooks/payhere` | PayHere payment notification webhook |

---

## 🧭 Dynamic Navigation

- **Guest:** `Home` · `Events` · `Sign In` · `Get Started`
- **Authenticated:** `Home` · `Events` · `[Avatar] FirstName ▾`
  - Dropdown: `My Profile` · `My Tickets` · `Dashboard` (if eligible role) · `Sign Out`
- Mobile-responsive hamburger menu mirrors the same state

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) for SMTP
- A [PayHere](https://www.payhere.lk) merchant account (sandbox for development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `env.local.example` to `.env.local` and fill in all values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=buddyticket

# Auth secrets — generate each with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
SESSION_SECRET=<random-32+-char-base64>
OTP_SECRET=<random-secret>
PASSWORD_SECRET=<random-secret>
QR_HMAC_SECRET=<random-secret>

# Gmail SMTP
GMAIL_USER=your.email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# App
MAINTENANCE_MODE=false
NODE_ENV=development
PUBLIC_SITE_URL=http://localhost:3000

# Support
SUPPORT_EMAIL=support@example.com
WHATSAPP_NUMBER=94763359863

# PayHere
PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_MERCHANT_SECRET=your_secret
PAYHERE_SANDBOX=true

# Bank transfer display
BANK_TRANSFER_BANK_NAME=Commercial Bank of Ceylon
BANK_TRANSFER_ACCOUNT_NUMBER=8001234567
BANK_TRANSFER_ACCOUNT_HOLDER=BuddyTicket (Pvt) Ltd
```

### 3. Database Setup

Run the Supabase migrations in order:

```bash
npx supabase link --project-ref <PROJECT_ID>
npx supabase db push
```

Or apply the migration files manually in your Supabase SQL editor:

1. `supabase/migrations/20260302144041_event_lifecycle_and_vip_prioritization_helpers.sql`
2. `supabase/migrations/20260305155506_01_tables_schema.sql`
3. `supabase/migrations/20260305161828_02_procedures_triggers_views.sql`
4. `supabase/migrations/20260306021004_03_seed_data.sql` *(optional — sample data)*

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 📁 Project Structure

```
buddytickets/
├── docs/                          # Documentation
│   ├── RunCodes.txt
│   └── schema-alignment-report.md
├── public/                        # Static assets
│   ├── email-logo.png
│   └── og-image.png
├── scripts/                       # Utility scripts
│   └── audit_schema_alignment.py
├── src/
│   ├── proxy.ts                   # Route protection middleware
│   ├── app/
│   │   ├── layout.tsx             # Root layout (fonts, metadata, toasts)
│   │   ├── globals.css            # Global styles
│   │   ├── not-found.tsx          # 404 page
│   │   ├── (auth)/                # Auth pages (guest-only)
│   │   │   ├── sign-up/
│   │   │   ├── sign-in/
│   │   │   ├── verify-email/
│   │   │   ├── forget-password/
│   │   │   └── reset-password/
│   │   ├── (main)/                # Main app shell (header + footer)
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── events/            # Event browsing & details
│   │   │   ├── (account)/         # Profile & ticket wallet
│   │   │   ├── checkout/          # Reservation → payment → confirmation
│   │   │   ├── dashboard/         # Role-based dashboards
│   │   │   └── become-an-organizer/
│   │   ├── api/webhooks/payhere/  # Payment webhook endpoint
│   │   ├── assets/                # Fonts, images, icons, logos
│   │   └── maintenance/           # Maintenance mode page
│   ├── components/
│   │   ├── core/                  # Header, Footer, Hero, FeaturedEvents
│   │   ├── shared/                # Event cards, ticket cards, checkout UI
│   │   └── ui/                    # Button, Input, Label, Toast primitives
│   └── lib/
│       ├── logger.ts              # Structured logging
│       ├── actions/               # Server actions
│       │   ├── auth.ts            # Sign-up, sign-in, OTP, password reset
│       │   ├── event.ts           # Event listing & detail queries
│       │   ├── checkout.ts        # Reservations & promo codes
│       │   ├── payment.ts         # Order creation & PayHere integration
│       │   ├── order.ts           # Order status & success data
│       │   ├── ticket.ts          # Ticket retrieval & QR codes
│       │   ├── profile.ts         # Profile CRUD & avatar upload
│       │   └── organizer.ts       # KYC onboarding & status
│       ├── supabase/              # Supabase client configuration
│       │   ├── admin.ts           # Service-role client (lazy singleton)
│       │   ├── client.ts          # Browser client
│       │   ├── server.ts          # Server-side client
│       │   └── middleware.ts       # Middleware client
│       ├── types/                 # TypeScript type definitions
│       └── utils/                 # Utility modules
│           ├── session.ts         # JWT session management
│           ├── otp.ts             # OTP generation & verification
│           ├── password.ts        # Password hashing with pepper
│           ├── mail.ts            # Email templates & sending
│           ├── payhere.ts         # PayHere hash generation
│           ├── qrcode.ts          # HMAC-SHA256 QR hash generation
│           ├── profile-image-upload.ts
│           └── organizer-doc-upload.ts
├── supabase/
│   ├── config.toml                # Supabase project config
│   └── migrations/                # SQL migration files (4 files)
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── env.local.example
└── LICENSE                        # MIT License
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

Copyright © 2026 Sudil Lakindu Mallika Arachchi

# BuddyTickets — Production-Grade Authentication System

A Next.js 16 (App Router) ticket-selling platform with a complete, custom authentication system built on raw Supabase tables (no Supabase Auth). Implements secure sign-up, sign-in, forgot-password flows with OTP email verification, progressive resend cooldowns, and JWT session management.

---

## Project Structure

```
docs/
├── RunCodes.txt
└── schema-alignment-report.md
public/
├── email-logo.png
└── og-image.png
scripts/
└── audit_schema_alignment.py
src/
├── proxy.ts
├── app/
│   ├── globals.css
│   ├── favicon.ico
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── forget-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx
│   │   ├── main-shell.tsx
│   │   ├── page.tsx
│   │   ├── (account)/
│   │   │   ├── profile/page.tsx
│   │   │   └── tickets/page.tsx
│   │   ├── become-an-organizer/page.tsx
│   │   ├── checkout/
│   │   │   ├── [reservationId]/
│   │   │   ├── cancel/
│   │   │   └── success/
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (organizer)/
│   │   │   ├── (staff)/
│   │   │   └── (system)/
│   │   ├── events/page.tsx
│   │   └── events/[eventId]/
│   ├── api/
│   │   └── webhooks/
│   │       └── payhere/
│   │           └── route.ts
│   ├── assets/
│   │   ├── fonts/
│   │   └── images/
│   │       ├── icons/
│   │       └── logo/
│   └── maintenance/
│       └── page.tsx
├── components/
│   ├── core/
│   │   ├── FeaturedEvents.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   └── Hero.tsx
│   ├── shared/
│   │   ├── target-cursor.tsx
│   │   ├── buy-ticket/
│   │   │   ├── ticket-cart-skeleton.tsx
│   │   │   └── ticket-cart.tsx
│   │   ├── checkout/
│   │   │   ├── order-summary-skeleton.tsx
│   │   │   └── order-summary.tsx
│   │   ├── event/
│   │   │   ├── event-card.tsx
│   │   │   ├── event-card-skeleton.tsx
│   │   │   ├── event-detail.tsx
│   │   │   └── event-detail-skeleton.tsx
│   │   └── ticket/
│   │       ├── ticket-card.tsx
│   │       └── ticket-skeleton.tsx
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── toast.tsx
└── lib/
    ├── logger.ts
    ├── actions/
    │   ├── auth.ts
    │   ├── checkout.ts
    │   ├── event.ts
    │   ├── order.ts
    │   ├── organizer.ts
    │   ├── payment.ts
    │   ├── profile.ts
    │   └── ticket.ts
    ├── supabase/
    │   ├── admin.ts
    │   ├── client.ts
    │   ├── middleware.ts
    │   └── server.ts
    ├── types/
    │   ├── auth.ts
    │   ├── checkout.ts
    │   ├── event.ts
    │   ├── organizer.ts
    │   ├── payment.ts
    │   ├── profile.ts
    │   └── ticket.ts
    ├── ui/
    │   └── utils.ts
    └── utils/
        ├── mail.ts
        ├── organizer-doc-upload.ts
        ├── otp.ts
        ├── password.ts
        ├── payhere.ts
        ├── profile-image-upload.ts
        ├── qrcode.ts
        └── session.ts
supabase/
├── config.toml
└── migrations/
  ├── 20260305155506_01_tables_schema.sql
  └── 20260305161828_02_procedures_triggers_views.sql
```

---

## Authentication Flows

### Sign-Up
1. User fills out the registration form (`/sign-up`)
2. Server action validates inputs, checks uniqueness, hashes password, inserts user
3. Generates OTP, stores hashed OTP in `otp_records`, creates `auth_flow_token`
4. Sends OTP via email → Redirects to `/verify-email?token=xxx`
5. User enters OTP → email verified → Redirected to `/sign-in`

### Sign-In
1. User enters credentials on `/sign-in`
2. Server validates email + password
3. **If email is not verified:** generates OTP → redirects to `/verify-email?token=xxx`
4. **If email is verified:** creates JWT session → redirects to home

### Forgot Password
1. User enters email on `/forget-password`
2. Server creates OTP → redirects to `/verify-email?token=xxx`
3. User verifies OTP → receives reset token → redirected to `/forget-password?step=reset&token=xxx`
4. User enters new password → password updated → redirected to `/sign-in`

---

## OTP Progressive Resend Delays

| Attempt | Cooldown |
|---------|----------|
| 1st     | 60 seconds |
| 2nd     | 2 minutes |
| 3rd     | 5 minutes |
| 4th     | 15 minutes |
| 5th     | 1 hour |
| 6th+    | 24 hours |

- Timer dynamically formats: `59s` → `2m 10s` → `1h 5m` → `1d 2h`
- Resend button disabled during cooldown
- State persisted in database (`otp_records.resend_count`, `last_sent_at`)
- Max 5 verification attempts per OTP before invalidation

---

## Route Protection (Middleware)

| Route | Rule |
|-------|------|
| `/verify-email` | Requires valid, non-expired `auth_flow_token` via `?token=` param. Direct access → `/sign-in` |
| `/forget-password?step=reset` | Requires valid reset `auth_flow_token`. Invalid → `/sign-in` |
| `/sign-in`, `/sign-up`, `/forget-password` | Authenticated users redirected to `/` |
| `/maintenance` | Only accessible when `MAINTENANCE_MODE=true` |

---

## Dynamic Navigation Bar

- **Guest:** `Home` · `Events` · `Sign In` · `Get Started`
- **Authenticated:** `Home` · `Events` · `[Avatar] FirstName ▾`
  - Dropdown: `My Profile` · `My Tickets` · `Sign Out`
- Mobile menu reflects the same guest/authenticated state

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `env.local.example` to `.env.local` and fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

SESSION_SECRET=<random-32+-char-string>
OTP_SECRET=<another-random-secret>

GMAIL_USER=your.email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

MAINTENANCE_MODE=false
NEXT_ENV=development
```

### 3. Database

Run the current migrations in order to create the full production schema:

- `supabase/migrations/20260305155506_01_tables_schema.sql`
- `supabase/migrations/20260305161828_02_procedures_triggers_views.sql`

### 4. Run Development Server

```bash
npm run dev
```

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Actions)
- **Language:** TypeScript (strict mode)
- **Database:** Supabase (PostgreSQL via REST API)
- **Session:** JWT via `jose` in httpOnly cookies
- **Passwords:** `bcryptjs` (hash + compare)
- **Email:** `nodemailer` (Gmail SMTP)
- **UI:** Tailwind CSS 4, Framer Motion, Lucide Icons, Sonner Toasts
- **Components:** Radix UI primitives, CVA variants

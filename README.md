# BuddyTickets — Production-Grade Authentication System

A Next.js 16 (App Router) ticket-selling platform with a complete, custom authentication system built on raw Supabase tables (no Supabase Auth). Implements secure sign-up, sign-in, forgot-password flows with OTP email verification, progressive resend cooldowns, and JWT session management.

---

## Project Structure

```
public/
├── email-logo.png                       # Logo used in OTP emails
└── og-image.png                         # Open Graph social preview image
src/
├── proxy.ts                             # (Legacy) maintenance-mode proxy
├── app/
│   ├── globals.css
│   ├── favicon.ico
│   ├── layout.tsx                       # Root layout (fonts, metadata, Toaster)
│   ├── not-found.tsx
│   ├── (auth)/
│   │   ├── layout.tsx                   # Auth background wrapper
│   │   ├── sign-in/page.tsx             # Sign-in page
│   │   ├── sign-up/page.tsx             # Sign-up page
│   │   ├── verify-email/page.tsx        # OTP verification page
│   │   └── forget-password/page.tsx     # Forgot/reset password page
│   ├── (main)/
│   │   ├── layout.tsx                   # Main layout (session provider)
│   │   ├── main-shell.tsx               # Client shell (Header + Footer wrapper)
│   │   ├── page.tsx                     # Home page
│   │   └── (account)/
│   │       ├── profile/
│   │       │   ├── loading.tsx          # Profile skeleton loader
│   │       │   └── page.tsx             # User profile page
│   │       └── tickets/
│   │           ├── loading.tsx          # Tickets skeleton loader
│   │           └── page.tsx             # User tickets page
│   ├── assets/
│   │   ├── fonts/                       # Custom typefaces (Bagel Fat One, Geom, Montserrat Alternates, etc.)
│   │   └── images/
│   │       ├── icons/
│   │       └── logo/
│   │           └── upscale_media_logo.png
│   └── maintenance/
│       └── page.tsx                     # Maintenance mode page
├── components/
│   ├── core/
│   │   ├── FeaturedEvents.tsx           # Featured events section
│   │   ├── Footer.tsx                   # Site footer
│   │   ├── Header.tsx                   # Dynamic navbar (guest vs authenticated)
│   │   └── Hero.tsx                     # Landing hero section
│   ├── shared/
│   │   └── target-cursor.tsx            # Custom animated cursor
│   └── ui/
│       ├── button.tsx                   # Button component (CVA variants)
│       ├── event-card.tsx               # Event display card
│       ├── input.tsx                    # Form input component
│       ├── label.tsx                    # Form label component
│       ├── ticket-card.tsx              # Ticket display card
│       └── toast.tsx                    # Toast notification component
├── lib/
│   ├── actions/
│   │   ├── auth.ts                      # Server Actions — auth mutations
│   │   ├── profile.ts                   # Server Actions — profile mutations
│   │   └── tickets.ts                   # Server Actions — ticket mutations
│   ├── auth/
│   │   ├── mail.ts                      # Nodemailer OTP email delivery
│   │   ├── otp.ts                       # OTP generation, hashing, progressive delay
│   │   ├── password.ts                  # Password hashing & comparison (bcryptjs + HMAC)
│   │   └── session.ts                   # JWT session create/read/destroy (jose)
│   ├── meta/
│   │   └── event.ts                     # Event metadata & queries
│   ├── supabase/
│   │   ├── admin.ts                     # Service-role Supabase client (server-only)
│   │   ├── client.ts                    # Browser Supabase client
│   │   ├── middleware.ts                # (Legacy) Supabase session refresh
│   │   └── server.ts                    # SSR Supabase client
│   └── ui/
│       └── utils.ts                     # Tailwind merge utility (cn helper)
supabase/
├── config.toml
└── migrations/
    └── 20260223191944_initial_schema.sql
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

Run the initial migration in your Supabase project to create the `users`, `otp_records`, and `auth_flow_tokens` tables. See `supabase/migrations/20260223191944_initial_schema.sql`.

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

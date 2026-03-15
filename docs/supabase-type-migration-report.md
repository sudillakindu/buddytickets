# Supabase Type Migration Report

## Overview

This migration replaced all manually created custom type files in `src/lib/types/` with a unified `src/lib/types/index.ts` that derives types exclusively from the auto-generated Supabase schema at `src/lib/types/supabase.ts`.

**`supabase.ts` was NOT modified during this migration.**

---

## Files Deleted (7 old custom type files)

| File | Types Exported |
|------|----------------|
| `src/lib/types/auth.ts` | `AuthResult`, `VerifyResult`, `ResendResult`, `OtpStatus`, `DataFetchResult<T>` |
| `src/lib/types/profile.ts` | `UserProfile`, `ProfileResult`, `ProfileFetchResult`, `ProfileImageResult` |
| `src/lib/types/ticket.ts` | `TicketStatus`, `Ticket` |
| `src/lib/types/event.ts` | `EventStatus`, `Event`, `EventImage`, `TicketType`, `Organizer`, `CategoryDetails`, `EventDetails`, `BaseActionResponse`, `GetFeaturedEventsResult`, `GetAllEventsResult`, `GetEventByIdResult` |
| `src/lib/types/checkout.ts` | `ReservationStatus`, `DiscountType`, `CartItem`, `ReservationRow`, `ReservationLineItem`, `CheckoutData`, `ReserveTicketsResult`, `PromotionRow`, `ValidatedPromotion`, `PromoValidationResult`, `PricingBreakdown`, `CreateReservationResult`, `GetCheckoutDataResult`, `BuyTicketItem` |
| `src/lib/types/payment.ts` | `PaymentSource`, `PaymentStatus`, `GatewayType`, `PaymentMethod`, `ALL_PAYMENT_METHODS`, `PAYMENT_METHODS`, `PaymentMethodOption`, `PaymentGatewayFormData`, `PaymentGatewayWebhookPayload`, `OrderRow`, `CreateOrderInput`, `CreatedOrder`, `CreateOrderResult`, `BankTransferDetails`, `TicketQRItem`, `FinalizeOrderResult`, `OrderSuccessData` |
| `src/lib/types/organizer.ts` | `OrganizerStatus`, `UserRole`, `OrganizerOnboardingUser`, `OrganizerDetails`, `OrganizerDetailsInput`, `OrganizerDetailsFieldErrors`, `OrganizerValidationResult`, `OrganizerBaseResult`, `OrganizerStateResult`, `SubmitOrganizerDetailsResult` |

---

## New File Created

### `src/lib/types/index.ts`

Single unified type file that re-exports utility types from `supabase.ts` and defines all application types as derivations of the Supabase schema.

---

## Type Mapping: Old → New

### Enum Types (now `Enums<"...">`)

| Old Type | New Definition |
|----------|---------------|
| `EventStatus` | `Enums<"event_status">` |
| `TicketStatus` | `Enums<"ticket_status">` |
| `ReservationStatus` | `Enums<"reservation_status">` |
| `DiscountType` | `Enums<"discount_type">` |
| `PaymentSource` | `Enums<"payment_source">` |
| `PaymentStatus` | `Enums<"payment_status">` |
| `GatewayType` | `Enums<"gateway_type">` |
| `PaymentMethod` | `Enums<"payment_source">` |
| `OrganizerStatus` | `Enums<"organizer_status">` |
| `UserRole` | `Enums<"user_role">` |

### Direct Row Types (now `Tables<"...">`)

| Old Type | New Definition |
|----------|---------------|
| `ReservationRow` | `Tables<"ticket_reservations">` |
| `PromotionRow` | `Tables<"promotions">` |
| `OrderRow` | `Tables<"orders">` |
| `EventImageRow` | `Tables<"event_images">` |
| `OrganizerDetailsRow` | `Tables<"organizer_details">` |

### Derived Row Types

| Old Type | New Definition | Notes |
|----------|---------------|-------|
| `UserProfile` | `Omit<Tables<"users">, "password_hash" \| "updated_at">` | Strips sensitive and non-profile fields |
| `TicketType` | `Omit<Tables<"ticket_types">, "inclusions" \| "qty_sold" \| "is_active" \| "version"> & { inclusions: string[]; qty_sold: number; is_active: boolean; version: number; }` | Narrows `inclusions` from `Json` to `string[]`; overrides nullable defaults to non-nullable |
| `EventImage` | `Tables<"event_images">` | Direct alias |
| `OrganizerDetails` | `Omit<Tables<"organizer_details">, "verified_by">` | Removes `verified_by` (not used in UI) |
| `OrganizerOnboardingUser` | `Pick<Tables<"users">, "user_id" \| "name" \| "email" \| "mobile" \| "role" \| "is_active">` | Narrowed pick from users table |

### Composite / View Types

| Old Type | New Definition | Notes |
|----------|---------------|-------|
| `Event` | `Omit<Tables<"events">, platform_fee_* \| status \| is_active \| is_vip \| created_at> & { status: Enums<"event_status">; is_active: boolean; is_vip: boolean; created_at: string; category: string; thumbnail_image: string \| null; start_ticket_price: number \| null; vip_priority_order: number \| null; }` | Extends events row with computed/joined fields from categories, event_images, ticket_types, vip_events |
| `Organizer` | `Pick<Tables<"users">, "user_id" \| "name" \| "image_url" \| "email" \| "username">` | Picked from users table |
| `CategoryDetails` | `Pick<Tables<"categories">, "category_id" \| "name" \| "description">` | Picked from categories table |
| `Ticket` | Custom interface using `Enums<"ticket_status">`, `Pick<Tables<"ticket_types">, ...>`, and `Pick<Tables<"events">, ...>` | Composite type for ticket display with joined ticket_type and event data |

### Unchanged Interface Types (kept as-is in index.ts)

These types don't map directly to DB tables — they are result types, input types, or UI-specific types:

- `AuthResult`, `VerifyResult`, `ResendResult`, `OtpStatus`, `DataFetchResult<T>`
- `ProfileResult`, `ProfileFetchResult`, `ProfileImageResult`
- `CartItem`, `ReservationLineItem`, `CheckoutData`, `ReserveTicketsResult`
- `ValidatedPromotion`, `PromoValidationResult`, `PricingBreakdown`
- `CreateReservationResult`, `GetCheckoutDataResult`, `BuyTicketItem`
- `PaymentMethodOption`, `PaymentGatewayFormData`, `PaymentGatewayWebhookPayload`
- `CreateOrderInput`, `CreatedOrder`, `CreateOrderResult`, `BankTransferDetails`
- `TicketQRItem`, `FinalizeOrderResult`, `OrderSuccessData`
- `OrganizerDetailsInput`, `OrganizerDetailsFieldErrors`, `OrganizerValidationResult`
- `OrganizerBaseResult`, `OrganizerStateResult`, `SubmitOrganizerDetailsResult`
- `BaseActionResponse`, `GetFeaturedEventsResult`, `GetAllEventsResult`, `GetEventByIdResult`
- `EventDetails`

---

## Files Modified (23 consumer files updated)

### Action Files

| File | Change |
|------|--------|
| `src/lib/actions/auth.ts` | Import path: `@/lib/types/auth` → `@/lib/types` |
| `src/lib/actions/profile.ts` | Import path: `@/lib/types/profile` → `@/lib/types` |
| `src/lib/actions/ticket.ts` | Import path: `@/lib/types/ticket` → `@/lib/types`; fixed `TicketRow.price_purchased` from `string` to `number` |
| `src/lib/actions/event.ts` | Import path: `@/lib/types/event` → `@/lib/types`; replaced `import("@/lib/types/payment").PaymentMethod` dynamic imports with static `PaymentMethod` import |
| `src/lib/actions/checkout.ts` | Import paths: `@/lib/types/checkout` + `@/lib/types/payment` → `@/lib/types`; added nullish coalescing (`?? 0`) for `PromotionRow` nullable fields (`usage_limit_global`, `current_global_usage`, `usage_limit_per_user`, `min_order_amount`) |
| `src/lib/actions/payment.ts` | Import paths: `@/lib/types/payment` + `@/lib/types/checkout` → `@/lib/types` |
| `src/lib/actions/order.ts` | Import path: `@/lib/types/payment` → `@/lib/types` |
| `src/lib/actions/organizer.ts` | Import path: `@/lib/types/organizer` → `@/lib/types` |

### Utility Files

| File | Change |
|------|--------|
| `src/lib/utils/payhere.ts` | Import path: `@/lib/types/payment` → `@/lib/types` |
| `src/lib/utils/payment-gateway.ts` | Import path: `@/lib/types/payment` → `@/lib/types` |

### Constants Files

| File | Change |
|------|--------|
| `src/lib/constants/event-status.ts` | Import path: `@/lib/types/event` → `@/lib/types` |

### Component Files

| File | Change |
|------|--------|
| `src/components/core/FeaturedEvents.tsx` | Import path: `@/lib/types/event` → `@/lib/types` |
| `src/components/shared/event/event-card.tsx` | Import path: `@/lib/types/event` → `@/lib/types` |
| `src/components/shared/event/event-detail.tsx` | Import path: `@/lib/types/event` → `@/lib/types` |
| `src/components/shared/buy-ticket/ticket-details.tsx` | Import paths: `@/lib/types/event` + `@/lib/types/checkout` → `@/lib/types` |
| `src/components/shared/checkout/order-summary.tsx` | Import paths: `@/lib/types/checkout` + `@/lib/types/payment` → `@/lib/types` |
| `src/components/shared/ticket/ticket-card.tsx` | Import path: `@/lib/types/ticket` → `@/lib/types` |

### Page Files

| File | Change |
|------|--------|
| `src/app/(main)/(account)/profile/page.tsx` | Import path: `@/lib/types/profile` → `@/lib/types` |
| `src/app/(main)/(account)/tickets/page.tsx` | Import path: `@/lib/types/ticket` → `@/lib/types` |
| `src/app/(main)/events/page.tsx` | Import path: `@/lib/types/event` → `@/lib/types` |
| `src/app/(main)/checkout/success/page.tsx` | Import path: `@/lib/types/payment` → `@/lib/types` |
| `src/app/(main)/become-an-organizer/page.tsx` | Import path: `@/lib/types/organizer` → `@/lib/types` |

### API Route Files

| File | Change |
|------|--------|
| `src/app/api/webhooks/payhere/route.ts` | Import path: `@/lib/types/payment` → `@/lib/types` |

---

## Structural Changes for Type Safety

### 1. PromotionRow Nullable Fields

`Tables<"promotions">` marks `usage_limit_global`, `current_global_usage`, `usage_limit_per_user`, and `min_order_amount` as `number | null`. The old manual `PromotionRow` had these as non-nullable `number`.

**Fix**: Added nullish coalescing (`?? 0`) in `checkout.ts` for all comparisons involving these fields.

### 2. TicketType Inclusions Override

`Tables<"ticket_types">` types `inclusions` as `Json` (the generic Supabase JSON type). The application always stores `string[]` in this column.

**Fix**: `TicketType` overrides `inclusions` to `string[]` via `Omit` + intersection.

### 3. TicketType Default Overrides

`Tables<"ticket_types">` marks `qty_sold`, `is_active`, and `version` as nullable because the DB columns have defaults but allow NULL. The application layer guarantees non-null values.

**Fix**: `TicketType` overrides these to non-nullable via `Omit` + intersection.

### 4. Event Composite Type

The `Event` type extends the events row with four computed fields (`category`, `thumbnail_image`, `start_ticket_price`, `vip_priority_order`) and excludes platform fee columns. Non-nullable overrides for `status`, `is_active`, `is_vip`, `created_at` ensure the action layer's guarantees are preserved.

### 5. Ticket.price_purchased Type Correction

The old `Ticket` interface had `price_purchased: string` while the DB column is numeric. Corrected to `number` (the `Number()` wrapper in the UI component is a safe no-op for numbers).

---

## Verification

- **TypeScript Build**: `npm run build` — ✅ Compiled successfully, zero type errors
- **ESLint**: `npm run lint` — ✅ Only pre-existing binary-parse error on `supabase.ts` (unrelated)
- **Runtime**: All routes compile and generate correctly
- **`supabase.ts` untouched**: Verified the auto-generated file was not modified

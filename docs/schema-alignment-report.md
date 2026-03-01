# Schema Alignment Audit Report

## Summary

- **DB-only alignment:** **100.0%** ✅

මෙය `src/lib/actions/*.ts` සහ `src/lib/types/*.ts` attributes, `supabase/migrations/20260223191944_initial_schema.sql` columns එක්ක compare කරලා ගත් result එක.

## File-level Results

### Actions (`db_only`)

- `auth.ts`: 100%
- `event.ts`: 100%
- `profile.ts`: 100%
- `ticket.ts`: 100%

### Types (`db_only`)

- `auth.ts`: 100%
- `event.ts`: 100%
- `profile.ts`: 100%
- `ticket.ts`: 100%

## Excluded Non-DB Keys (Not counted in DB alignment)

- `auth.ts`: `canResend`, `message`, `remainingSeconds`, `success`
- `event.ts`: `category`, `images`, `primary_image`, `start_ticket_price`, `ticket_types`
- `profile.ts`: `message`, `success`
- `ticket.ts`: `event`, `primary_image`, `ticket_type`

## Final Decision

"DB tables වල attributes එක්ක සමානද?" කියන ප්‍රශ්නයට:

- **DB-backed attributes = 100% ගැලපේ** ✅

## Re-run Command

```bash
python scripts/audit_schema_alignment.py
```

## CI Command

```bash
python scripts/audit_schema_alignment.py --fail-under 100
```

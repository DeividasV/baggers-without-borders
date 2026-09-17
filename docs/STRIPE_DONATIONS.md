# Stripe Donations Feature Documentation

**Feature Branch:** `feature/stripe-donations` (merged)  
**Version:** 0.1218.0  
**Status:** Production Active

## Overview

The Stripe Donations feature enables users to donate to the BwB platform through secure one-time or monthly credit card payments. The system uses Stripe Checkout for payment processing and webhooks for transaction verification.

**Key capabilities:**

- One-time and monthly donations in multiple currencies (EUR, USD, GBP)
- Preset amounts and custom amounts
- Stripe Checkout session with hosted payment page
- Webhook-verified transaction completion
- Transparent payment disclosure (donors see the statement descriptor set on the operator's own Stripe account, shown here as [STATEMENT DESCRIPTOR])
- Full accessibility compliance (WCAG 2.1 AA)

Each operator sets their own statement descriptor in their own Stripe account; nothing
in this software sets it or depends on it.

## Architecture

### Components

```
┌─────────────────┐
│   User Profile  │
│  Landing Page   │
└────────┬────────┘
         │ Click "Donate"
         ▼
┌─────────────────┐
│ DonationForm    │ ← Select amount/currency
└────────┬────────┘
         │ Submit
         ▼
┌─────────────────┐
│ POST /api/      │ ← Create Stripe session
│ donations/      │   Rate limit check
│ checkout        │   Amount validation
└────────┬────────┘
         │ Redirect URL
         ▼
┌─────────────────┐
│ Stripe Checkout │ ← User enters card
│ (hosted page)   │   Stripe processes
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 Success   Cancel
    │         │
    ▼         ▼
┌─────────────────┐
│ /donate/success │
│ /donate/cancelled│
└─────────────────┘
         │
         │ (Meanwhile, webhook fires)
         ▼
┌─────────────────┐
│ POST /api/      │ ← Stripe webhook
│ donations/      │   Signature verify
│ webhook         │   Update DB status
└─────────────────┘
```

### File Structure

```
app/
├── donate/
│   ├── page.tsx                    # Donation form page
│   ├── success/page.tsx            # Success redirect
│   └── cancelled/page.tsx          # Cancellation redirect
├── api/donations/
│   ├── checkout/route.ts           # Create Stripe session
│   └── webhook/route.ts            # Handle Stripe webhooks
└── components/features/donations/
    ├── DonationForm.tsx            # Main form component
    └── index.ts                    # Barrel export

src/lib/
├── stripe.ts                       # Stripe client singleton
├── validation/donations.ts         # Schema validation
└── constants/donations.ts          # Currencies, amounts

prisma/
├── schema.prisma                   # donations table schema
└── migrations/
    └── 20260113_add_donations_manual/
        └── migration.sql           # SQL migration

__tests__/
├── api/donations.api.test.ts       # API integration tests
├── components/features/donations/
│   └── DonationForm.minimal.test.tsx
├── a11y/donations.a11y.test.tsx    # Accessibility tests
└── responsive/donations.responsive.test.tsx
```

## Database Schema

### `donations` Table

```sql
CREATE TABLE donations (
  id                    TEXT PRIMARY KEY,
  amount                INTEGER NOT NULL,        -- Amount in smallest currency unit (cents)
  currency              TEXT NOT NULL,           -- 'EUR', 'USD', 'GBP'
  type                  TEXT NOT NULL,           -- 'ONE_TIME', 'MONTHLY'
  status                TEXT NOT NULL,           -- 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'
  stripeSessionId       TEXT NOT NULL UNIQUE,
  stripeSubscriptionId  TEXT UNIQUE,
  userId                TEXT,                     -- Optional user link
  donorEmail            TEXT NOT NULL,
  donorName             TEXT,
  createdAt             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completedAt           DATETIME,

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);
```

**Status flow:**

1. `PENDING` - Created when checkout session starts
2. `COMPLETED` - Updated by the `checkout.session.completed` webhook when payment succeeds
3. `CANCELLED` - Updated by the `checkout.session.expired` webhook
4. `FAILED` - Allowed by the schema for failed payment records

## Configuration

### Environment Variables

**Required for all environments:**

```bash
# Stripe Secret Key (server-side only)
# Test keys start with sk_test_ ; live keys start with sk_live_
STRIPE_SECRET_KEY=<paste the secret key from the Stripe dashboard>

# Stripe Webhook Secret (for signature verification)
# Get from Stripe Dashboard after creating webhook endpoint; starts with whsec_
STRIPE_WEBHOOK_SECRET=<paste the webhook signing secret>
```

**Not used:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` appears in `.env.example`
(commented out) but is read nowhere in the codebase. Donations redirect to
Stripe's hosted Checkout page, which only needs the server-side secret key.
The publishable key is reserved for possible future Stripe Elements work; setting
it has no effect today.

**Note:** The required Stripe secrets are server-side only, so changing them
requires reloading the environment (restart/redeploy) — they are not baked into
the client JavaScript bundle.

### Stripe Dashboard Setup

1. **Get API Keys:**
   - Go to https://dashboard.stripe.com/apikeys
   - Copy the Secret Key (`sk_live_...`)
   - Add it to `.env` as `STRIPE_SECRET_KEY`

2. **Create Webhook Endpoint:**
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - URL: `https://example.com/api/donations/webhook`
   - Events to listen: `checkout.session.completed`, `checkout.session.expired`
   - Copy webhook signing secret (`whsec_...`)
   - Add to `.env` as `STRIPE_WEBHOOK_SECRET`

3. **Test Mode vs Live Mode:**
   - Development uses test keys (`sk_test_`)
   - Production uses live keys (`sk_live_`)
   - Stripe Dashboard has toggle for Test/Live mode

## API Endpoints

### POST `/api/donations/checkout`

Create a Stripe Checkout session.

**Request Body:**

```json
{
  "amount": 25, // Amount in major currency units, e.g. 25 = €25 (required, 1-10000)
  "currency": "EUR", // 'EUR' | 'USD' | 'GBP' (required)
  "type": "MONTHLY", // 'ONE_TIME' | 'MONTHLY' (required)
  "donorEmail": "user@example.com", // Required
  "donorName": "John Doe", // Optional
  "returnTo": "/profile" // Optional redirect after success
}
```

**Validation:** `amount` is validated against `DONATION_LIMITS` in
`src/lib/constants/donations.ts` (`MIN_AMOUNT = 1`, `MAX_AMOUNT = 10000`). It is
sent in major currency units and converted to the smallest unit before storage:
the route writes `donations.amount` (and the Stripe price) as `amount * 100`.

**Response (Success):**

```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Response (Error):**

```json
{
  "error": "Donation amount must be between €1 and €10,000"
}
```

Other validation errors include `"Please select or enter a valid donation
amount"`, `"Maximum donation amount is 10,000"`, `"Invalid currency (must be
USD, EUR, or GBP)"`, `"Invalid donation type (must be ONE_TIME or MONTHLY)"` and
`"Valid email address is required"`.

**Rate Limiting:**

- 10 checkout sessions per 15 minutes per IP address (`donation-checkout` config in `src/lib/rateLimit.ts`)
- Returns 429 with a "Please wait 15 minutes" message if the limit is exceeded

### POST `/api/donations/webhook`

Handle Stripe webhook events (internal, called by Stripe).

**Headers Required:**

- `stripe-signature`: Webhook signature for verification

**Events Handled:**

- `checkout.session.completed` - Updates donation status to COMPLETED
- `checkout.session.expired` - Updates donation status to CANCELLED

**Response:**

```json
{
  "received": true
}
```

## Usage Examples

### Basic Donation Flow

1. User navigates to `/donate` or clicks "Donate to BwB" button
2. Selects preset amount or enters custom amount
3. Chooses currency (EUR, USD, GBP)
4. Submits form → creates checkout session
5. Redirects to Stripe Checkout page
6. User enters card details and completes payment
7. Redirects to `/donate/success` or `/donate/cancelled`
8. Stripe webhook updates donation status to COMPLETED

### Integrating Donation Button

```tsx
import Link from "next/link";
import { Button } from "@/app/components/ui";

export function DonateButton() {
  return (
    <Link href="/donate">
      <Button variant="primary">Donate to BwB</Button>
    </Link>
  );
}
```

### Checking Donation Status

```bash
# SSH to production server
ssh root@example.com

# Query recent donations
sqlite3 /srv/bwb/data/bwb.db "
SELECT
  id,
  CAST(amount AS REAL) / 100.0 as amount,
  currency,
  status,
  donorName,
  donorEmail,
  datetime(createdAt) as created,
  datetime(completedAt) as completed
FROM donations
ORDER BY createdAt DESC
LIMIT 10;
"
```

## Testing

### Running Tests

```bash
# API integration tests
npm run test:api -- __tests__/api/donations.api.test.ts

# Component tests
npm test -- __tests__/components/features/donations/

# Accessibility tests
npm run test:a11y -- __tests__/a11y/donations.a11y.test.tsx

# Responsive tests
npm test -- __tests__/responsive/donations.responsive.test.tsx

# All donation-related tests
npm test -- donations
```

### Test Coverage

- **API Tests:** 482 lines - checkout creation, validation, webhooks
- **Component Tests:** 128 lines - form interactions, state management
- **A11y Tests:** 222 lines - WCAG compliance, ARIA attributes
- **Responsive Tests:** 198 lines - mobile, tablet, desktop layouts

### Manual Testing Checklist

**Development (Test Mode):**

- [ ] Use Stripe test cards: `4242 4242 4242 4242`
- [ ] Test successful payment flow
- [ ] Test cancelled payment
- [ ] Verify webhook events in Stripe Dashboard
- [ ] Check donation status in database

**Production (Live Mode):**

- [ ] Verify live keys are configured
- [ ] Test with real card (small amount)
- [ ] Confirm [STATEMENT DESCRIPTOR] appears on statement
- [ ] Check webhook delivery in Stripe Dashboard
- [ ] Verify donation recorded with COMPLETED status

## Deployment

### Initial Setup

1. **Add environment variables to production `.env`:**

   ```bash
   ssh root@example.com
   cd /srv/bwb
   nano .env
   # Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
   ```

2. **Run database migration:**

   ```bash
   docker exec bwb-climbing npx prisma migrate deploy
   ```

3. **Rebuild and restart container:**
   ```bash
   docker compose -f docker-compose.prod.yml down
   docker compose -f docker-compose.prod.yml up -d --build
   ```

### Regular Deployment

When deploying code changes that include `.env` updates:

```bash
# From local machine
npm run deploy
```

This automatically:

- Builds Docker image locally
- Transfers to production server
- Updates `.env` from local version
- Restarts container with new environment

**Important:** The Stripe secrets are server-side only, so a container restart/redeploy that reloads `.env` is enough — no client bundle rebuild is required. The unused `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` has no effect either way.

## Troubleshooting

### Issue: "Invalid API Key provided"

**Cause:** Wrong key format or old key cached

**Solution:**

1. Verify key starts with `sk_live_` (not `rk_live_` restricted key)
2. Ensure key is in `/srv/bwb/.env` on production
3. Fully recreate container:
   ```bash
   docker compose -f docker-compose.prod.yml down
   docker compose -f docker-compose.prod.yml up -d
   ```

### Issue: "Your card was declined. Your request was in test mode, but used a non test card"

**Cause:** The server is using a test-mode secret key (`sk_test_`) instead of a live key

**Solution:**

1. Verify `STRIPE_SECRET_KEY` is a live key (`sk_live_`)
2. Rebuild container (restart won't work):
   ```bash
   npm run deploy  # From local machine
   ```

### Issue: Webhook not firing

**Cause:** Webhook endpoint not configured in Stripe

**Solution:**

1. Go to https://dashboard.stripe.com/webhooks
2. Verify endpoint exists: `https://example.com/api/donations/webhook`
3. Check webhook signing secret matches `.env`
4. Test webhook from Stripe Dashboard → "Send test webhook"

### Issue: Donations stuck in PENDING status

**Cause:** Webhook failed or signature verification failed

**Solution:**

1. Check Stripe Dashboard → Webhooks → Event logs for failures
2. Verify `STRIPE_WEBHOOK_SECRET` matches webhook endpoint secret
3. Check production logs:
   ```bash
   docker logs bwb-climbing | grep webhook
   ```
4. Manually trigger webhook from Stripe Dashboard

### Issue: Rate limit exceeded

**Cause:** Too many checkout attempts from same IP

**Solution:**

- Wait 15 minutes for the rate limit window to reset
- Or manually clear rate limits:
  ```bash
  npm run db:cleanup-rate-limits
  ```

## Security Considerations

1. **Never commit API keys to git** - Keys are in `.env` (gitignored)
2. **Webhook signature verification** - Always validates requests are from Stripe
3. **Server-side validation** - All amounts/currencies validated before checkout
4. **Rate limiting** - Prevents abuse of checkout endpoint
5. **IP hashing** - Rate limit IPs are hashed (SHA-256) for privacy
6. **Amount limits** - Min 1, max 10,000 in major currency units (1-10,000 stored as 100-1,000,000 cents)

## Accessibility Features

- **WCAG 2.1 AA compliant** - Meets contrast ratios, keyboard navigation
- **ARIA labels** - All form inputs have descriptive labels
- **Focus management** - Clear focus indicators, logical tab order
- **Screen reader support** - Status announcements, form validation messages
- **Responsive design** - Mobile-friendly, touch-friendly targets
- **Error messages** - Clear, actionable validation messages

## Future Enhancements

Potential improvements (not currently implemented):

- [ ] Donation tiers with perks
- [ ] Donation history page for users
- [ ] Admin dashboard for donation analytics
- [ ] Email receipts via Brevo
- [ ] Export donation reports (CSV)
- [ ] Thank you badges on user profiles
- [ ] Donation goals/progress bars

## Running Costs Visualization

### Overview

The `RunningCostsIndicator` component
([app/components/features/donations/RunningCostsIndicator.tsx](../app/components/features/donations/RunningCostsIndicator.tsx),
106 lines) is an `async` server component rendered on the donation page
(`/donate`), below the "About BwB" section and inside a `DonationErrorBoundary`.
It shows a single timeline bar indicating how much of the platform's running
cost has been covered by contributions.

**Key features:**

- Single progress bar with contributed (green), gap (amber), pre-funded surplus
  (light green) and remaining future (gray) segments
- Summary line with total spent since September 2025, the estimated monthly cost
  and the estimated yearly cost
- A "now" divider on a rolling timeline that starts in September 2025 and ends
  13 months after the current month
- Accessible markup: `role="progressbar"` with
  `aria-valuenow`/`aria-valuemin`/`aria-valuemax` and an `aria-label`, `<time>`
  date labels, and semantic `<section>`/`<h3>` elements
- Amount labels for the contributed total, gap and surplus

### How the Figures Are Loaded

The component calls `getFundingSettings()` from
[`src/lib/funding-settings.ts`](../src/lib/funding-settings.ts). That helper
reads three `AppSetting` rows in the `funding` category:

| Setting key               | Meaning                                      |
| ------------------------- | -------------------------------------------- |
| `funding_total_spent`     | Total platform costs incurred to date (EUR)  |
| `funding_total_collected` | Total contributions received to date (EUR)   |
| `funding_monthly_est`     | Estimated ongoing monthly running cost (EUR) |

If a key is missing or unparsable, or the query fails, the value falls back to
`FUNDING_DEFAULTS` in
[`src/lib/funding-bar-utils.ts`](../src/lib/funding-bar-utils.ts) — currently
`totalSpent: 630.36`, `totalCollected: 559.08`, `monthlyEst: 40`. All figures
are in **EUR**.

`computeBarSegments()` in the same file converts those three numbers into the
bar segments (contributed %, gap %, pre-funded surplus %, future %, the "now"
position and the timeline end date). There are **no** `TOTAL_RECEIVED_USD`,
`YEARLY_COST_USD`, `START_MONTH`/`END_MONTH` or `START_YEAR`/`END_YEAR`
constants in the component, and no manual code edit is needed to update the
totals.

### Updating the Figures

An admin updates the figures at runtime — no code change or deployment is
required:

1. Sign in as an admin and go to `/admin/settings`.
2. In the **Funding & Running Costs** section, edit **Total Spent**,
   **Total Collected** and/or **Monthly Estimate**.
3. Save. The form `PUT`s each value to `/api/app-settings` with
   `category: "funding"`.

The `/donate` page reads the settings on each request, so the new values appear
on the next page load. To verify, open `/donate` and confirm the bar segments,
amount labels and "now" marker match the saved values (a database error
deliberately falls back to the defaults rather than hiding the bar).

### Related Files

| File                                                          | Role                                                             |
| ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `app/components/features/donations/RunningCostsIndicator.tsx` | Server component (106 lines) that renders the timeline           |
| `src/lib/funding-settings.ts`                                 | Loads the three `funding` settings, with defaults on failure     |
| `src/lib/funding-bar-utils.ts`                                | `FUNDING_DEFAULTS`, `FundingSettings` type, `computeBarSegments` |
| `app/components/features/settings/SettingsView.tsx`           | Admin "Funding & Running Costs" editor                           |

## Related Documentation

- [Environment Variables](../.env.example) - Full environment variable reference
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment process
- [API Reference](./API_REFERENCE.md) - All API endpoints

## Support

For issues or questions:

1. Check Stripe Dashboard for payment/webhook status
2. Review production logs: `docker logs bwb-climbing -f`
3. Test in development with Stripe test mode first
4. Contact Stripe Support for payment processing issues

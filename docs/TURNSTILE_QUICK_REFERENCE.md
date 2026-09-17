# Cloudflare Turnstile Quick Reference

## Setup for Development

1. **Add test keys to `.env.local`:**

   ```bash
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
   TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
   ```

2. **Start dev server:**

   ```bash
   npm run dev
   ```

3. **Test forms:**
   - Visit http://localhost:1345/register
   - Submit form (no visible CAPTCHA with test key)
   - Check network tab for Siteverify call

## Setup for Production

1. **Get real keys from Cloudflare:**
   - Go to https://dash.cloudflare.com
   - Navigate to Turnstile section
   - Create widget for your domain
   - Copy sitekey and secret key

2. **Add to production environment:**

   ```bash
   # In .env.production or server environment variables
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...your-real-sitekey
   TURNSTILE_SECRET_KEY=0x4BBB...your-real-secret-key
   ```

3. **Verify deployment:**
   - Test all auth forms
   - Check Turnstile analytics dashboard
   - Monitor server logs for fail-open events

## Test Keys Reference

| Key Type       | Always Pass                         | Always Fail                         | Duplicate Error                     |
| -------------- | ----------------------------------- | ----------------------------------- | ----------------------------------- |
| **Sitekey**    | 1x00000000000000000000AA            | 2x00000000000000000000AB            | -                                   |
| **Secret Key** | 1x0000000000000000000000000000000AA | 2x0000000000000000000000000000000AA | 3x0000000000000000000000000000000AA |

## Protected Endpoints

✅ `/api/auth/register` - Registration  
✅ `/api/auth/forgot-password` - Password reset  
✅ `/api/auth/resend-verification` - Resend verification  
✅ NextAuth credentials provider - Login

## Widget Configuration

```tsx
<div
  className="cf-turnstile"
  data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
  data-theme="dark" // Matches BWB theme
  data-size="normal" // Widget size
  data-appearance="interaction-only" // Invisible until bot detected
></div>
```

## Server-Side Verification Pattern

```typescript
import { verifyTurnstileToken, getClientIp, shouldBlockRequest } from "@/src/lib/turnstile";

const ip = getClientIp(request.headers);
const { turnstileToken } = await request.json();

const result = await verifyTurnstileToken(turnstileToken, ip);

if (shouldBlockRequest(result)) {
  return NextResponse.json(
    { error: "CAPTCHA verification failed. Please try again." },
    { status: 400 }
  );
}

// Continue processing...
```

## Client-Side Token Capture

```typescript
// Get token from Turnstile widget
const turnstileToken = (
  document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement
)?.value;

// Include in API request
const response = await fetch("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({ ...formData, turnstileToken }),
});
```

## Testing Commands

```bash
# Run all tests
npm run test

# Run Turnstile tests only
npm run test -- __tests__/lib/turnstile.test.ts

# Watch mode
npm run test:watch

# Check TypeScript
npx tsc --noEmit
```

## Common Error Codes

| Error Code               | Meaning                 | Solution                                 |
| ------------------------ | ----------------------- | ---------------------------------------- |
| `missing-input-response` | Token not provided      | Ensure widget renders and token captured |
| `invalid-input-response` | Invalid/malformed token | Check token format, not expired          |
| `timeout-or-duplicate`   | Token expired or reused | Generate new token (refresh page)        |
| `invalid-input-secret`   | Wrong secret key        | Verify secret key matches sitekey        |

## Fail-Open Behavior

When Turnstile API is unreachable:

- ✅ Request is **allowed** (not blocked)
- ⚠️ Warning is logged to console
- 🛡️ Rate limiting provides backup protection

## Monitoring

**Log Patterns:**

```
"blocked by Turnstile" → Bot detected
"allowed despite Turnstile timeout" → Fail-open triggered
"Turnstile validation failed" → Invalid token
```

**Check Analytics:**

- Cloudflare Turnstile dashboard
- Success/failure rates
- Challenge solve rates
- Geographic distribution

## Troubleshooting

**Widget not showing:**

- Check `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set
- Verify script loaded in Network tab
- Ensure domain matches Cloudflare configuration

**"CAPTCHA verification failed" on every request:**

- Check secret key matches sitekey
- Verify using matching test/production keys
- Check server logs for error codes

**Tests failing:**

- Ensure test keys in `jest.env.js`
- Check MSW handler is active
- Verify mock responses match expected format

## Documentation

- 🧪 Turnstile tests: `__tests__/lib/turnstile.test.ts`, `__tests__/lib/turnstile-test-keys.test.ts`, `__tests__/unit/turnstileUtils.test.ts` and the four `*-turnstile.test.ts` suites under `__tests__/api/auth/`
- 📚 Archived testing docs — historical reference (internal, not published)
- 🔗 [Cloudflare Docs](https://developers.cloudflare.com/turnstile/)

## Quick Checklist

**Development:**

- [x] Test keys in `.env.local`
- [x] Forms render and submit
- [x] Tests pass

**Production:**

- [ ] Real keys from Cloudflare dashboard
- [ ] Domain registered in Turnstile settings
- [ ] Staging tested with real keys
- [ ] Monitoring configured
- [ ] Analytics dashboard accessible

## Support

Check logs for error codes → see the test files listed above → [Cloudflare Docs](https://developers.cloudflare.com/turnstile/)

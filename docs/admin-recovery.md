# Admin password recovery

Email delivery is implemented with the Resend HTTPS API. It is disabled until the
production environment has RESEND_API_KEY (secret) and ADMIN_EMAIL_FROM (verified
sender). Preserve ADMIN_EMAILS and SITE_ORIGIN. Deploy a saved version after
setting runtime values through Sites. Do not place credentials in source or chat.
If a different provider is used, replace only server/admin-email.ts.

The link targets the configured HTTPS SITE_ORIGIN, never a request Host header.
Tokens use 32 random bytes, are stored only as SHA-256 hashes and expire after
15 minutes. A conditional account-version update atomically invalidates the used
link, every sibling link and all prior sessions. It does not automatically log in.
Email is sent only for an existing, allowlisted administrator. Recovery cannot
activate a new account. Responses do not disclose registration; delivery runs in
Cloudflare waitUntil and logs contain no tokens, email addresses or API responses.

Persistent attempt windows last 15 minutes from the first attempt, not a clock
boundary. Login/activation: 5 per email, 10 per IP, 40 globally. Reset completion:
separate limits at the same levels. Email requests: 3 per email, 5 per IP, 20 globally.
All attempts count, including successful logins. A 429 response includes Retry-After.

Verification before enabling delivery:
1. Set a verified sender and provider secret via Sites runtime settings; redeploy.
2. Request a reset for the administrator and check actual inbox/spam delivery.
3. Open the emailed link, enter matching strong passwords, then sign in normally.
4. Confirm the previous password, previous sessions and the same link no longer work.
5. Confirm unknown addresses receive the same public response and no message.

Tests: node --experimental-transform-types --test tests/admin-auth.test.mjs tests/backend.test.mjs
Provider behavior uses mocked HTTP in tests; no production mail was sent.
References:
https://resend.com/docs/api-reference/emails/send-email
https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
https://developers.cloudflare.com/changelog/post/2025-08-08-add-waituntil-cloudflare-workers/

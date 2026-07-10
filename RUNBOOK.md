# Agentic DevPack — Runbook

Operational reference for admins and team members. For general usage see [README.md](./README.md).

---

## Table of Contents

1. [Error Messages & What To Do](#1-error-messages--what-to-do)
2. [API Key Problems](#2-api-key-problems)
3. [Analysis Failures](#3-analysis-failures)
4. [Rate Limiting](#4-rate-limiting)
5. [Source File Issues](#5-source-file-issues)
6. [Account Access](#6-account-access-formerly-password-gate)
7. [(Removed) Changing the Password](#7-removed-changing-the-password)
8. [Deploying Changes](#8-deploying-changes)
9. [GitHub Pages Troubleshooting](#9-github-pages-troubleshooting)
10. [Security Incidents & Credential Hygiene](#10-security-incidents--credential-hygiene)

---

## 1. Error Messages & What To Do

| Message | Cause | Fix |
|---------|-------|-----|
| `Invalid API key — double-check it at console.anthropic.com` | Key is wrong or expired | Clear key, re-copy from Anthropic console, save again |
| `API key lacks permissions — check your Anthropic account plan` | Account not activated or trial expired | Log in to console.anthropic.com and check account status |
| `Rate limited — wait 30 seconds and try again` | Too many requests | Wait — tool retries automatically up to 3 times |
| `No credits remaining — add billing at console.anthropic.com/settings/billing` | Account has no balance | Add a payment method at console.anthropic.com/settings/billing |
| `Network error — check your internet connection` | No connectivity or firewall blocking api.anthropic.com | Check internet; if on corporate VPN, try without it |
| `Anthropic API is temporarily unavailable — try again in a few minutes` | Anthropic outage (HTTP 500/529) | Wait and retry; check status.anthropic.com |
| `AI response was not in the expected format — try a shorter source file` | Source file too large, response truncated | Paste only the crashing function and its callers |
| `Source file is too large` | File exceeds 40 KB limit | See [Source File Issues](#5-source-file-issues) |
| `Please paste a GDB backtrace` | Backtrace field is empty | Paste the GDB output before running |

---

## 2. API Key Problems

### Key not auto-populating
Each user's key is stored in **their own browser's localStorage**. It does not roam across machines or browsers. Every new browser/machine requires a fresh paste and Save.

### Key says "saved" but Test shows invalid
1. Click **🗑 Clear Key**
2. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys
3. Revoke the old key and create a new one
4. Paste the new key → **Save Key** → **⚡ Test Key**

### Key works on one browser but not another
Normal — localStorage is per browser. Paste and save the key in each browser you use.

### Key starts with `sk-ant-` but Save rejects it
The key may have been copied with a trailing space or newline. Click the eye icon to reveal it and check for invisible characters. Delete and retype the last character if needed.

### Corporate proxy / firewall blocking the API
The tool calls `api.anthropic.com` directly from the browser. Some corporate networks block outbound HTTPS to non-whitelisted domains. Ask your network team to whitelist `api.anthropic.com:443`. Alternatively use on a personal connection or mobile hotspot.

---

## 3. Analysis Failures

### "AI response was not in the expected format"
The AI returned something other than valid JSON — usually caused by:
- Source file too large (most common) → paste only the relevant section
- Backtrace too long → trim to the first 30 frames
- Model was confused by mixed languages — specify the language explicitly in the backtrace field as a comment

### Analysis runs but results look wrong
- Check that you pasted the **correct source file** — the one the binary was compiled from, not a different version
- Check that the **backtrace matches the source** — if the binary was compiled from a different commit, line numbers won't align
- Switch to **Sonnet 4.5** for more thorough analysis on complex multi-frame crashes

### Analysis starts then shows a blank result panel
Open browser DevTools (F12) → Console tab. Copy the error and check against the table in [Section 1](#1-error-messages--what-to-do).

### Download button does nothing
The fixed file is only available after a successful analysis. If the result panel shows but the Download button does nothing, the AI did not return a `fixed_code` field — this can happen with confidence=Low results. Use the **Fixed File** tab to manually copy the code instead.

---

## 4. Rate Limiting

The tool handles rate limits automatically with up to **3 retries**. The progress log shows a live countdown:

```
⏳ Rate limited — retrying in 12s (attempt 1/3)…
↩ Retrying now (attempt 1/3)…
```

### If all 3 retries are exhausted
The error `Rate limited` will appear. Options:
- Wait 1–2 minutes and click **⚡ Run DevPack Analysis** again
- Switch to **Haiku 4.5** — it has a higher rate limit than Sonnet
- If you hit this frequently, your API key's tier may have low rate limits — check console.anthropic.com/settings/limits

### Multiple team members hitting rate limits simultaneously
Each user has their own API key, so rate limits are per-user, not shared. Simultaneous usage by different users does not compound rate limiting.

---

## 5. Source File Issues

### File too large (blocked at > 40 KB)
Do not paste the entire codebase. The tool needs only the code relevant to the crash. Strategy:

1. Read the backtrace — it tells you exactly which functions are in the call stack
2. Copy those functions from your source file
3. Include any structs / typedefs those functions use
4. Paste that excerpt (typically 50–200 lines) instead of the full file

### Size warning shown (15–40 KB)
The analysis will still run but may be less accurate if the model has to process a lot of irrelevant code. Trimming to the crashing functions improves both accuracy and cost.

### File upload shows no content
The uploaded file may be binary (e.g. a compiled object file) or in an unsupported encoding. The tool accepts plain text source files only. If the file fails to load, an error is shown — paste the content manually instead.

### Wrong filename shown in results
The filename is used only for display and for naming the downloaded fixed file. If you pasted code manually and didn't upload a file, the default name `source.cpp` is used. To change it, upload the file using the **Upload** button instead of pasting.

---

## 6. Account Access (formerly "Password Gate")

**This section is out of date as of 2026-07 — there is no shared team password anymore.** An earlier version of the product gated access with a single SHA-256-hashed password shared by the whole team (a `var HASH = '...'` check in `index.html`, unlocked via `sessionStorage.setItem('devpack_ok', '1')`). That code no longer exists in `index.html` — access is now per-user via real Supabase accounts (`si-password`/`su-password` sign-in/sign-up fields, email+password or OAuth). Each team member has their own individual login; there is nothing shared to rotate.

### Forgot your password
Use the in-app "Forgot Password" flow (`doForgotPassword()` — sends a Supabase password reset email to the address on the account). There is no admin-held master password.

### Adding a new team member
They sign up for their own account via the app's sign-up form. There's no shared credential to hand out.

### Revoking someone's access
Remove/disable their row in the Supabase `users` table (or their Supabase auth user) — there's no shared password to rotate to lock them out.

---

## 7. (Removed) Changing the Password

This section previously documented rotating the old shared `HASH` password. That mechanism doesn't exist anymore — see [Section 6](#6-account-access-formerly-password-gate). Left as a placeholder so old links to `#7-changing-the-password` don't 404 silently; update any bookmarks.

---

## 8. Deploying Changes

The tool is a single file — `index.html`. There is no build step.

```bash
# Make your edits to index.html, then:
git add index.html
git commit -m "describe your change"
git push
```

GitHub Actions deploys automatically. Check deployment status at:
```
https://github.com/codehunter03/Project-Core-Agentic-DevPack/actions
```

### Deployment takes more than 5 minutes
Go to the Actions tab and check for a failed workflow. Common causes:
- Branch protection rule preventing push to `main` — merge via PR instead
- GitHub Pages not enabled — go to repo Settings → Pages → set source to `main` branch

### Rollback a bad deployment

```bash
# Revert to the previous commit
git revert HEAD
git push

# Or hard-reset to a specific commit (destructive — confirm with team first)
git reset --hard <commit-hash>
git push --force
```

---

## 9. GitHub Pages Troubleshooting

### Site shows old version after a push
GitHub Pages can take up to 2 minutes to propagate. Hard-refresh the browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac). If still stale after 5 minutes, check the Actions tab for a failed deployment.

### Site shows 404
- Confirm GitHub Pages is enabled: repo Settings → Pages → Source: `main` branch, `/ (root)` folder
- Confirm `index.html` exists at the root of the repo (not in a subfolder)

### Mixed content / fonts not loading
The tool loads fonts from `fonts.googleapis.com`. Some networks or browser extensions block Google Fonts. The tool still works — it falls back to the system monospace font. No action needed.

### CORS error in DevTools console
The `anthropic-dangerous-direct-browser-access: true` header is required for direct browser-to-API calls and is supported by Anthropic. If you see a CORS error, your browser extension (ad blocker, privacy shield) may be stripping this header — disable extensions for this site and retry.

---

## 10. Security Incidents & Credential Hygiene

### 2026-07-10 incident log

A pre-launch review of the refund policy flow led to a broader security sweep of this repo. Findings and fixes:

| Finding | Fix |
|---|---|
| `origin` remote URL had a live GitHub PAT (`ghp_2F2s...`) embedded in plaintext in `.git/config` | Switched remote to SSH: `git@github.com:codehunter03/Project-Core-Agentic-DevPack.git` |
| `README.md` contained the **live team password** and the **live Lambda `TEAM_TOKEN`** in plaintext — confirmed exposed publicly since 2026-04-09 (`c3041da`), verified via unauthenticated fetch to `raw.githubusercontent.com` | Redacted both from `README.md`; replaced with pointers to secure storage. Values are still the pre-rotation ones until [Outstanding rotation steps](#outstanding-rotation-steps-manual--requires-adminawsgithub-access-this-repo-doesnt-have) below are done — do not re-add them to any file, including this one |
| `README.md` documented `git push --force` as the routine deploy command (password rotation + general deploy) | Changed both to plain `git push` — force-push should only ever be an explicit, confirmed, emergency action, as already documented in [Section 8](#8-deploying-changes) |
| Upgrade modal + a code comment in `index.html` said "Stripe" when checkout actually runs through Lemon Squeezy | Corrected both to Lemon Squeezy |
| `privacy.html` claimed "we do not share your data with third parties" directly above a list of third-party processors (Anthropic, Supabase, AWS Lambda, Lemon Squeezy) | Reworded to "we do not sell or share your data with third parties for marketing or advertising purposes" |
| Stale `index.html_backup_main` / `index.html_tmp` files sitting untracked in the repo root, containing outdated (pre-fix) copy | Deleted — they were never deployed (deploy workflow only uploads the git-tracked checkout), but posed a risk of accidentally being committed and going live via a careless `git add -A` |

### Outstanding rotation steps (manual — requires admin/AWS/GitHub access this repo doesn't have)

These credentials were exposed in git history even after the docs were redacted — the working files are clean, but the values already went out to anyone who cloned or fetched the repo while it was public. Rotate both:

1. **Revoke the old GitHub PAT** (`ghp_2F2s...`): GitHub → Settings → Developer settings → Personal access tokens → find it → Revoke.
2. **Rotate the team password**: follow [Section 7](#7-changing-the-password) to generate a new hash and update `index.html`'s `HASH`. Communicate the new password to the team out-of-band (Slack DM, 1Password, etc). Never commit the plaintext password anywhere, including README/docs.
3. **Rotate the Lambda `TEAM_TOKEN`**: AWS Console → Lambda → `devpack-api` → Configuration → Environment variables → set a new value. Communicate it out-of-band. Never commit the value anywhere.

### Going forward — secret hygiene checklist

- Never commit a plaintext secret, password, or token to *any* tracked file — including README/RUNBOOK/docs, not just code. Docs get read by the same public that can read the code.
- Assume this repo is public when deciding what's safe to write down — verify with `curl -s -o /dev/null -w "%{http_code}" https://raw.githubusercontent.com/<org>/<repo>/main/<file>` if unsure (a `200` means anyone can fetch it, no auth required).
- Use SSH (or a credential helper like `gh auth login`) for git remotes — never a personal access token embedded directly in the remote URL.
- Reserve `git push --force` for confirmed, deliberate rollback situations only (see [Section 8](#8-deploying-changes)) — never document it as a routine/default deploy step.

### 2026-07-11 — Lambda hardening (`index.mjs`)

A deeper look at `index.mjs` (not tracked in this repo — pulled from AWS Lambda for review) found the "team token" check accepted a **hardcoded literal `'CDA-AUTH'` in addition to `TEAM_TOKEN`**, in 5 places (`validate()`, `/userplan`, `/increment`, `/correlate`, `/validate-fix`). That string was also hardcoded in `index.html`'s client JS, so it was visible to anyone who viewed page source — meaning rotating `TEAM_TOKEN` alone would never have closed the hole. Additionally, `/analyze` never checked `analyses_used`/`analyses_limit` server-side (the free-tier cap was UI-only), and the built-in rate limiter keyed on a client-supplied `user_id`, which is trivially spoofable.

Fixed in `index.mjs`:
- Removed the `'CDA-AUTH'` bypass from all 5 checks — only the real `TEAM_TOKEN` env var value is accepted now.
- `/analyze` now looks up the caller's plan/usage in Supabase and rejects with 403 if a free-plan user is at or over their limit, instead of trusting the client.
- The rate limiter now keys on source IP instead of the client-supplied `user_id`.

**To deploy:** paste the updated `index.mjs` into AWS Console → Lambda → `devpack-api` → Code source → Deploy, **and** set the Lambda's `TEAM_TOKEN` environment variable to the new value at the same time the corresponding `index.html` frontend commit goes live — the old hardcoded value and the new one are incompatible, so these two must ship together or requests will 401 in between.

**Residual limitation, for a later fast-follow:** this still relies on one shared token baked into public JS — a determined attacker can still extract whatever token ships next via view-source. The real fix is to verify each user's actual Supabase login session (JWT) server-side per request instead of a shared static secret, since that's individually issued, expiring, and revocable. Not done yet — flagged here so it isn't lost.

**Decision (2026-07-11):** deliberately deferred until after launch — implementing it touches ~10 fetch call sites across `index.html` plus `index.mjs`, with no staging/test Supabase project to validate against, so a bug would break `analyze`/`chat`/`advisor` for every live user simultaneously. Concrete failure modes this leaves open in the meantime:
- Anyone who extracts the current `TEAM_TOKEN` from page source can call `/analyze`, `/chat`, `/advisor`, `/validate-fix` with a **freshly made-up `user_id`** on every request. Each fake id gets its own 3 free analyses before the per-user Supabase check kicks in (added in this same hardening pass) — so the free-tier cap is real per-identity, but identities themselves are free to mint.
- Bounded in practice by the mitigations already in place: API Gateway throttling (rate/burst limits), the Anthropic monthly spend cap, and the AWS budget alarm — so worst case is "hits a rate limit / spend cap and gets noticed," not "unbounded bill."
- Revisit once there's room to test against a real (ideally staging) Supabase project without launch-day time pressure.

### 2026-07-11 — `/lspay` webhook stopgap

`/lspay` (Lemon Squeezy subscription webhook — upgrades a user to `plan: 'pro'`, `analyses_limit: 999999`) had **no verification that the request actually came from Lemon Squeezy**. Anyone could `POST` a fabricated payload with `event_name: 'subscription_created'` and any email and grant that account unlimited free Pro access.

**Stopgap added** (not real signature verification — that requires the Lemon Squeezy webhook signing secret, which needs to be pulled from the LS dashboard and isn't available here): `/lspay` now requires a `?key=<LSPAY_SECRET>` query parameter matching a new `LSPAY_SECRET` Lambda environment variable. Generated value: `a526bd4b1d92b077c717e17193fbe0dd6dbb0813188ceef7`.

**To deploy:**
1. AWS Console → Lambda → `devpack-api` → Configuration → Environment variables → add `LSPAY_SECRET` = `a526bd4b1d92b077c717e17193fbe0dd6dbb0813188ceef7`
2. Redeploy the updated `index.mjs` (already includes the check)
3. Lemon Squeezy dashboard → Settings → Webhooks → edit the webhook URL to `https://sympib3n8l.execute-api.us-east-1.amazonaws.com/lspay?key=a526bd4b1d92b077c717e17193fbe0dd6dbb0813188ceef7`

Until step 3 is done, real Lemon Squeezy webhooks will also get rejected with 401 — do all three together, or Pro upgrades on real purchases will silently stop working.

**Fast-follow:** replace this with real HMAC signature verification against Lemon Squeezy's webhook signing secret (Settings → Webhooks → your webhook → Signing secret) once you have a moment — the stopgap only raises the bar from "trivial" to "must know this URL," it isn't cryptographic.

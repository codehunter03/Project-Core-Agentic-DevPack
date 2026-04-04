# Agentic DevPack — Runbook

Operational reference for admins and team members. For general usage see [README.md](./README.md).

---

## Table of Contents

1. [Error Messages & What To Do](#1-error-messages--what-to-do)
2. [API Key Problems](#2-api-key-problems)
3. [Analysis Failures](#3-analysis-failures)
4. [Rate Limiting](#4-rate-limiting)
5. [Source File Issues](#5-source-file-issues)
6. [Password Gate](#6-password-gate)
7. [Changing the Password](#7-changing-the-password)
8. [Deploying Changes](#8-deploying-changes)
9. [GitHub Pages Troubleshooting](#9-github-pages-troubleshooting)

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

## 6. Password Gate

### Forgot the password
Ask your admin. The password is not stored anywhere recoverable — if it's lost, the admin must rotate it (see [Section 7](#7-changing-the-password)).

### Gate keeps reappearing on every new tab
The gate uses `sessionStorage`, which is tab-scoped. Opening a new tab requires re-entering the password. This is by design — the session expires when the tab closes.

### Bypassing the gate (admin only — for testing)
Open browser DevTools → Console:
```javascript
sessionStorage.setItem('devpack_ok', '1'); location.reload();
```

### The password gate is not real security
Correct. Anyone who can view the page source can see the SHA-256 hash and bypass the gate via DevTools. The gate is a friction layer only. Do not rely on it to protect sensitive information. The meaningful restriction is the personal Anthropic API key requirement.

---

## 7. Changing the Password

### Generate the new hash

**Linux / macOS terminal:**
```bash
echo -n "YourNewPassword" | sha256sum
# copy the 64-character hex string (ignore the trailing " -")
```

**Windows PowerShell:**
```powershell
[System.BitConverter]::ToString(
  [System.Security.Cryptography.SHA256]::Create().ComputeHash(
    [System.Text.Encoding]::UTF8.GetBytes("YourNewPassword")
  )
).Replace("-","").ToLower()
```

**Online (no terminal):**
[emn178.github.io/online-tools/sha256.html](https://emn178.github.io/online-tools/sha256.html) — type the password, copy the result.

### Update the file

In `index.html`, find:
```javascript
var HASH = 'e34f5cbf233f274b8602ae750a3ea9a83a0e397b31cf2b9ae911b863a1557cf9';
```

Replace only the hash string inside the quotes. Do **not** add a `var PASS =` line — the plaintext password must never appear in source.

### Deploy

```bash
git add index.html
git commit -m "chore: rotate access password"
git push
```

Site updates in ~60 seconds. Communicate the new password to your team out-of-band (Slack DM, 1Password, etc — not in a public channel or commit message).

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

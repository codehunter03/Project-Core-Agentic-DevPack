# Agentic DevPack
**Core Dump Analyzer & Auto-Fix Engine — powered by Claude AI**

Live URL: `https://codehunter03.github.io/Project-Core-Agentic-DevPack/`

---

## What It Does

Paste a GDB backtrace and the crashing source file — DevPack uses Claude AI to:

- Identify the **exact root cause** (not just the signal)
- Highlight the **faulting line** in your source
- Generate a **complete fixed source file**
- Show a **unified diff** of every change
- Give **defensive coding suggestions** to prevent recurrence
- Let you **follow up in chat** if the fix doesn't fully resolve the crash

Supports: C · C++ · Python · Go · Rust · Java · JavaScript · TypeScript

Bug classes: Null Pointer Dereference · Buffer Overflow · Use-After-Free · Race Condition · Integer Overflow · Stack Corruption · Memory Leak · Double Free · Format String · Logic Error

---

## Accessing the Tool

The tool is protected by a password gate.

Contact your admin for the team password. After unlocking, each user must enter their own Anthropic API key — the tool does not work without one.

> **Note:** The password gate is a friction layer, not a security boundary. The tool's real access control is the requirement for a valid personal Anthropic API key.

---

## First-Time Setup (for each team member)

1. Open the live URL above
2. Enter the team password → click **Unlock DevPack**
3. Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com)
4. Paste your key into the **Your Anthropic API Key** banner at the top
5. Click **Save Key** — then click **⚡ Test Key** to confirm it works
6. You're ready to analyze crashes

Your key is stored only in your browser's `localStorage`. It is never sent anywhere except directly to Anthropic's API.

---

## Running an Analysis

1. Paste your GDB backtrace into the **GDB Backtrace / Core Output** field

   ```bash
   # Generate a backtrace with GDB
   gdb ./binary ./core -ex "bt full" -ex "info locals" -ex "quit"
   ```

2. Paste or upload your crashing source file (use **Upload** for files up to ~40 KB)
3. Select a model:
   - **Haiku 4.5** — fastest, cheapest (~$0.01/analysis) — good for most crashes
   - **Sonnet 4.5** — more thorough (~$0.04/analysis) — use for complex multi-frame bugs
4. Click **⚡ Run DevPack Analysis**
5. Review results across four tabs: **Analysis · Diff · Fixed File · Suggestions**
6. Download the fixed file with **⬇ Download Fixed File**
7. If the fix doesn't fully resolve the crash, describe what happened in the **Follow-up** chat at the bottom

---

## Source File Size Limits

| Size | Status |
|------|--------|
| < 15 KB | OK — no warning |
| 15–40 KB | Warning shown — may approach token limit |
| > 40 KB | Blocked — analysis will not run |

If your file is too large, paste only the relevant section: the crashing function and its immediate callers. The backtrace tells you exactly which functions to include.

---

## API Key Management

| Button | What it does |
|--------|-------------|
| **Save Key** | Validates format and stores key in browser localStorage |
| **⚡ Test Key** | Makes a live ping to Anthropic to confirm the key works |
| **🗑 Clear Key** | Removes the key from this browser (with confirmation prompt) |

**Validation rules on Save:**
- Must start with `sk-ant-`
- Must be at least 40 characters
- Must contain no spaces (catches truncated copy-pastes)

---

## Rate Limiting

If Anthropic rate-limits a request (HTTP 429), the tool automatically retries up to **3 times** using the `retry-after` interval from Anthropic's response. A live countdown is shown in the progress log. No action needed from the user.

---

## Cost

Each team member uses their own API key and is billed directly by Anthropic.

| Model | Cost per analysis | $5 budget |
|-------|-------------------|-----------|
| Haiku 4.5 | ~$0.01 | ~500 analyses |
| Sonnet 4.5 | ~$0.04 | ~125 analyses |

Follow-up chat messages cost less than a full analysis (smaller prompts, 2 048 token cap).

---

## Privacy

Your backtrace and source code are sent directly to Anthropic's API for analysis.

- **Do not paste** proprietary, classified, or NDA-protected code
- For sensitive codebases, paste only the relevant few functions and anonymise variable/function names
- Anthropic's [Privacy Policy](https://www.anthropic.com/legal/privacy) applies to all data sent via the API

---

## Changing the Password

### Step 1 — Generate a new SHA-256 hash

```bash
echo -n "YourNewPassword" | sha256sum
```

Or use an online tool: [emn178.github.io/online-tools/sha256.html](https://emn178.github.io/online-tools/sha256.html)

### Step 2 — Update index.html

Find this line (near the top of the `<head>` script block):

```javascript
var HASH = 'e34f5cbf233f274b8602ae750a3ea9a83a0e397b31cf2b9ae911b863a1557cf9';
```

Replace the hash string with your new one. Keep the quotes. Do **not** add a `PASS =` variable — the plaintext password must never appear in source.

### Step 3 — Deploy

```bash
git add index.html
git commit -m "chore: rotate access password"
git push
```

GitHub Pages updates in ~60 seconds. The old password stops working immediately.

---

## Security Notes

| What | Where it lives |
|------|----------------|
| Team password | SHA-256 hash only — plaintext never in source |
| API keys | Each user's browser `localStorage` — never on any server |
| Source code & backtraces | Sent only to Anthropic's API per their Privacy Policy |
| Nothing | Sent to any intermediate server |

The password gate is client-side only. A determined person who can view the page source can bypass it. The meaningful access control is the personal API key requirement.

---

## Deployment

The tool is a single static HTML file deployed via GitHub Pages.

```bash
# No build step needed — edit index.html and push
git add index.html
git commit -m "your message"
git push
```

GitHub Actions (`.github/workflows/deploy.yml`) handles the Pages deployment automatically on every push to `main`.

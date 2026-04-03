# 🔬 Agentic DevPack — GitHub Pages

Core Dump Analyzer & Auto-Fix Engine — powered by Claude AI.
Fully static, runs in the browser. No server required.

## 🚀 Deploy in 5 Minutes

### Step 1 — Create GitHub repo
```
New repo → name: agentic-devpack → Public → Create
```

### Step 2 — Push these files
```bash
git init
git add .
git commit -m "feat: Agentic DevPack v1.0"
git remote add origin https://github.com/YOUR_USERNAME/agentic-devpack.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages
```
Repo → Settings → Pages
Source: GitHub Actions
```

### Step 4 — Done!
Your team URL:
```
https://YOUR_USERNAME.github.io/agentic-devpack/
```

## How It Works

Each team member:
1. Opens the URL
2. Enters their own Anthropic API key (stored in their browser only)
3. Pastes GDB backtrace + source file
4. Clicks Analyze → gets root cause + fixed file

## Security

- API keys are stored in each user's **localStorage** — never on any server
- All calls go **directly from browser → Anthropic API**
- No data is logged or stored anywhere

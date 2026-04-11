# CoreDumpAnalyzer
**Core Dump Analyzer & Auto-Fix Engine — powered by Claude AI**

> AI-powered tool that analyzes GDB core dumps, identifies root causes, and generates complete fixes automatically.

**Live:** https://coredumpanalyzer.com

---

## 🔐 Team Access

```
URL      : https://coredumpanalyzer.com
Password : DevPack@2024
API Key  : Each person gets their own at console.anthropic.com (~$5 credits)
Cost     : ~$0.01 per crash analysis
```

---

## 🔑 How to Change the Password

**Step 1** — Generate a SHA-256 hash of your new password:
```
https://emn178.github.io/online-tools/sha256.html
```

**Step 2** — In `index.html` find:
```javascript
var HASH = 'e34f5cbf233f274b8602ae750a3ea9a83a0e397b31cf2b9ae911b863a1557cf9';
```
Replace with your new hash.

**Step 3** — Also update Lambda environment variable:
```
AWS Console → Lambda → devpack-api → Configuration → Environment variables
TEAM_TOKEN → your-new-token
```

**Step 4** — Deploy:
```bash
git add index.html
git commit -m "chore: update access password"
git push --force
```

---

## 🏗 Architecture

```
coredumpanalyzer.com          AWS Lambda (hidden)
(GitHub Pages — public)       api via API Gateway
      ↓                              ↓
  HTML form only              - System prompts
  No secrets                  - Business logic
  No prompts                  - Team validation
  No logic                    - Anthropic routing
```

---

## 🚀 How Your Team Uses It

1. Open `https://coredumpanalyzer.com`
2. Enter team password
3. Enter your Anthropic API key → Save Key → Test Key
4. Paste GDB backtrace — file advisor auto-scans in 1 second
5. Upload suggested source files
6. Click **🔬 Analyze Core Dump**
7. Get root cause + fixed file + diff + suggestions
8. Use follow-up chat if first fix doesn't fully resolve it

---

## 🐛 Supported Bug Types

Null Pointer Dereference · Buffer Overflow · Use-After-Free ·
Race Condition · Integer Overflow · Stack Corruption ·
Memory Leak · Double Free · Format String · Logic Error

## 📝 Supported Languages

C · C++ · Python · Go · Rust · Java · JavaScript · TypeScript

---

## 🛠 CLI Tool (Advanced)

```bash
cd agentic-devpack
export ANTHROPIC_API_KEY="sk-ant-..."
pip install -r requirements.txt

# With actual core dump
python main.py \
  --core ./core.12345 \
  --binary ./myapp \
  --source ./src/handler.cpp

# With pasted GDB output
python main.py \
  --backtrace ./bt.txt \
  --source ./src/handler.cpp
```

---

## ☁️ AWS Lambda Backend

| Resource | Details |
|---|---|
| Function | `devpack-api` |
| Region | `us-east-1` |
| Runtime | `Node.js 20.x` |
| Timeout | `3 minutes` |
| Memory | `256 MB` |
| API Gateway | `sympib3n8l.execute-api.us-east-1.amazonaws.com` |

### Lambda Environment Variables
| Key | Value |
|---|---|
| `TEAM_TOKEN` | `DevPackTeam2024!` |

### Lambda Routes
| Route | Method | Purpose |
|---|---|---|
| `/health` | GET | Health check + warm ping |
| `/warm` | GET | Keep-alive ping |
| `/analyze` | POST | Full crash analysis |
| `/advisor` | POST | File requirements scan |
| `/chat` | POST | Follow-up iterative fix |

---

## 💰 Cost Breakdown

| Service | Free Tier | Monthly Cost |
|---|---|---|
| GitHub Pages | Free | $0 |
| AWS Lambda | 1M requests free forever | $0 |
| AWS API Gateway | 1M/month free (12 months) | ~$0.005 after |
| GoDaddy Domain | — | ~$1/month |
| Anthropic API | Pay per use | ~$0.01/analysis |

---

## 🔒 Security

- Team password: SHA-256 hashed — never plain text in source
- Anthropic API keys: each user's browser localStorage only
- System prompts: in Lambda — never visible in browser source
- Source code sent to Anthropic API only — not stored anywhere

---

## 🔄 Deploying Updates

```bash
# Frontend
git add index.html
git commit -m "your change"
git push --force

# Lambda — paste new index.mjs in AWS Console → Deploy
```

---

*Developed by Devendra Pillay © 2026*

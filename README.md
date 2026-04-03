# 🔬 Agentic DevPack
**Core Dump Analyzer & Auto-Fix Engine — powered by Claude AI**

Live URL: `https://codehunter03.github.io/Project-Core-Agentic-DevPack/`

---

## 🔐 Team Access Password

The DevPack is protected by a password gate.

**Default password:**
```
DevPack@2024
```
Share this with your team members. Change it anytime using the instructions below.

---

## 🔑 How to Change the Password

### Step 1 — Generate a new SHA-256 hash
Go to:
```
https://emn178.github.io/online-tools/sha256.html
```
Type your new password → copy the hash that appears below it.

### Step 2 — Update index.html
Open `index.html` and find this line:
```javascript
const PASS_HASH = 'e34f5cbf233f274b8602ae750a3ea9a83a0e397b31cf2b9ae911b863a1557cf9';
```
Replace the hash string with your new one. Keep the quotes.

### Step 3 — Push to GitHub
```bash
git add index.html
git commit -m "chore: update access password"
git push --force
```
Site updates in ~60 seconds. Old password stops working immediately.

---

## 🚀 How Your Team Uses It

1. Open `https://codehunter03.github.io/Project-Core-Agentic-DevPack/`
2. Enter the team password
3. Enter their own Anthropic API key (`console.anthropic.com`)
4. Paste GDB backtrace + source file
5. Click **⚡ Run DevPack Analysis**
6. Get root cause + fixed file + patch + suggestions

---

## 💰 Cost Per Analysis

Each team member uses their own API key and pays independently.

| Model | Cost per analysis |
|---|---|
| Haiku 4.5 | ~$0.01 |
| Sonnet 4 | ~$0.04 |

$5 = 125–500 crash analyses.

---

## 🛠 CLI Tool (Advanced)

For direct terminal usage without the browser:

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

Output files saved to `devpack_output/`:
```
handler_fixed.cpp     ← Fixed source file
handler.patch         ← Unified diff
devpack_report.html   ← Full visual report
analysis.json         ← Machine-readable result
```

---

## 🔒 Security Notes

| What | Where it stays |
|---|---|
| Team password | SHA-256 hashed — never plain text |
| API keys | Each user's browser localStorage only |
| Source code | Sent only to Anthropic API |
| Nothing | Sent to any other server |

---

## 🐛 Supported Bug Types

Null Pointer Dereference · Buffer Overflow · Use-After-Free ·
Race Condition · Integer Overflow · Stack Corruption ·
Memory Leak · Double Free · Format String · Logic Error

## 📝 Supported Languages

C · C++ · Python · Go · Rust · Java · JavaScript · TypeScript

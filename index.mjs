import https from 'https';

// ── Constants ──────────────────────────────────────────────────────────────
const TEAM_TOKEN     = process.env.TEAM_TOKEN || '';
const ANTHROPIC_URL  = 'https://api.anthropic.com/v1/messages';
const ALLOWED_ORIGINS = [
  'https://coredumpanalyzer.com',
  'https://www.coredumpanalyzer.com',
];

// ── CORS Headers ───────────────────────────────────────────────────────────
function getCORS(event) {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  // Always allow coredumpanalyzer.com — return its origin if matched, else first allowed
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':      allowOrigin,
    'Access-Control-Allow-Methods':     'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers':     'Content-Type, X-Team-Token, X-Api-Key',
    'Access-Control-Max-Age':           '300',
    'Access-Control-Allow-Credentials': 'false',
    'Content-Type':                     'application/json',
  };
}

// Error response always includes CORS so browser can read the error body
function respondError(statusCode, message, event) {
  return {
    statusCode,
    headers: getCORS(event || {}),
    body: JSON.stringify({ error: message }),
  };
}

// ── System Prompts (hidden from browser) ───────────────────────────────────
const ANALYSIS_PROMPT = `You are a world-class systems debugging engineer with 20+ years of experience.

MISSION: Given a GDB backtrace and source file, identify the EXACT root cause and produce a CORRECT fix.

REASONING CHAIN — follow before producing output:
1. Signal: SIGSEGV=memory, SIGABRT=abort/assert, SIGFPE=arithmetic, SIGBUS=alignment
2. Backtrace: which frame is in user source? function + line?
3. Source: what operation at that line? what could go wrong?
4. Bug class: null deref? buffer overflow? use-after-free? race? off-by-one?
5. Root cause: WHY is the value bad — not just WHERE
6. Fix: minimal correct change — handle all edge cases
7. Verify: walk through fixed code mentally with same inputs

RULES:
- fixed_code MUST be the COMPLETE source file — every line
- Fix must be minimal — only change what is necessary
- Preserve original style, indentation, variable names
- Output ONLY valid JSON — no markdown, no preamble

JSON structure:
{
  "root_cause": "precise sentence naming exact bug and direct cause",
  "bug_category": "Null Pointer Dereference|Buffer Overflow|Use-After-Free|Race Condition|Integer Overflow|Stack Corruption|Memory Leak|Double Free|Format String|Logic Error",
  "severity": "Critical|High|Medium|Low",
  "confidence": "High|Medium|Low",
  "faulting_line": 42,
  "faulting_function": "function_name",
  "explanation": "3 paragraphs: what happens at crash, where bad value comes from, why bug exists",
  "fix_explanation": "what changed, why it fixes the root cause, edge cases handled",
  "fixed_code": "COMPLETE source file with fix — every single line",
  "patch_summary": "e.g. Line 87: added null check before dereferencing conn->buf",
  "defensive_suggestions": ["specific tip 1", "specific tip 2", "specific tip 3"],
  "code_fix": {
    "buggy_snippet": [
      {"line": 0, "code": "exact buggy line verbatim", "annotation": "why this causes the crash"}
    ],
    "fixed_snippet": [
      {"line": 0, "code": "exact fixed line verbatim", "annotation": "what this fix does"}
    ],
    "context_before": "3 lines before the bug",
    "context_after": "3 lines after the bug"
  }
}`;

const ADVISOR_PROMPT = `You are a senior C/C++/systems engineer analyzing a crash backtrace.
Your job: identify ALL source files needed to fully diagnose this crash.

ANALYZE:
1. Every filename mentioned in the backtrace frames
2. Functions called — infer their likely source/header files
3. Structs/classes used at crash site — find their definition files
4. Memory allocators/utilities called before crash
5. The call chain — which callers caused the bad state?

CRITICALITY SCORING:
- critical: file directly mentioned at crash frame #0/#1
- important: file in call chain (#2-#5), or contains struct/class definition
- optional: utility/helper files that provide context

RESPOND ONLY with valid JSON:
{
  "files": [
    {
      "filename": "exact_filename.cpp",
      "criticality": "critical|important|optional",
      "reason": "one sentence why this file is needed",
      "frames": "e.g. frames #0, #1"
    }
  ],
  "summary": "one sentence describing the crash location and what context is needed"
}`;

const FOLLOWUP_PROMPT = `You are an expert systems debugging engineer helping a developer fix a crash iteratively.
You already analyzed a crash and provided a fix. The developer is reporting back with results.

YOUR JOB:
1. Read what the developer reports — did the fix work? Did the crash move? New backtrace?
2. If the crash moved — analyze the new location
3. If the fix did not work — reconsider the root cause
4. Always give a CONCRETE next action with specific code changes

RESPONSE FORMAT: plain text with code blocks. Start with your updated understanding, then give the specific fix. Be concise and actionable.`;

// ── Helper: call Anthropic API ─────────────────────────────────────────────
function callAnthropic(apiKey, systemPrompt, userMessage, maxTokens = 8096) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system:     systemPrompt,
      messages:   Array.isArray(userMessage)
                    ? userMessage
                    : [{ role: 'user', content: userMessage }],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers:  {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject({ status: res.statusCode, error: parsed });
          } else {
            resolve(parsed.content[0].text);
          }
        } catch (e) {
          reject({ status: 500, error: 'Failed to parse Anthropic response' });
        }
      });
    });

    req.on('error', (e) => reject({ status: 503, error: e.message }));
    req.setTimeout(120000, () => { req.destroy(); reject({ status: 504, error: 'Request timed out' }); });
    req.write(body);
    req.end();
  });
}

// ── Helper: response builder ───────────────────────────────────────────────
function respond(statusCode, body, event) {
  return {
    statusCode,
    headers: getCORS(event || {}),
    body: JSON.stringify(body),
  };
}

// ── Helper: validate request ───────────────────────────────────────────────
function validate(event) {
  const teamToken = event.headers?.['x-team-token'] || event.headers?.['X-Team-Token'] || '';
  const apiKey    = event.headers?.['x-api-key']    || event.headers?.['X-Api-Key']    || '';

  if (!TEAM_TOKEN) return { error: 'TEAM_TOKEN environment variable not set on server' };
  if (teamToken !== TEAM_TOKEN) return { error: 'Invalid team token — access denied' };
  if (!apiKey || !apiKey.startsWith('sk-ant-')) return { error: 'Valid Anthropic API key required' };

  return { apiKey };
}

// ── Main Handler ───────────────────────────────────────────────────────────
export const handler = async (event) => {

  // Support both HTTP API v1 and v2 event formats
  const method = event.httpMethod
    || event.requestContext?.http?.method
    || event.requestContext?.httpMethod
    || 'POST';

  // Handle CORS preflight — always return 200 with CORS headers
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: getCORS(event), body: '' };
  }

  // Parse path — support both API Gateway formats
  const path = event.rawPath || event.path || '/';

  // ── Route: /health + /warm (keep-alive ping) ───────────────────────────
  if (path === '/health' || path.endsWith('/health') ||
      path === '/warm'   || path.endsWith('/warm')) {
    return respond(200, {
      status:  'ok',
      version: '1.0',
      message: 'DevPack API is running',
      ts:      Date.now(),
    }, event);
  }

  // ── Validate for all other routes ────────────────────────────────────
  const { apiKey, error } = validate(event);
  if (error) return respondError(401, error, event);

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return respondError(400, 'Invalid JSON body', event);
  }

  // ── Route: /analyze ───────────────────────────────────────────────────
  if (path === '/analyze' || path.endsWith('/analyze')) {
    const { backtrace, source, filename, additionalFiles } = body;

    if (!backtrace || !source) {
      return respond(400, { error: 'backtrace and source are required' }, event);
    }

    // Build multi-file context if provided
    let multiFileCtx = '';
    if (additionalFiles && typeof additionalFiles === 'object') {
      const names = Object.keys(additionalFiles);
      if (names.length > 0) {
        multiFileCtx = '\n\n## ADDITIONAL SOURCE FILES\n';
        names.forEach(fname => {
          const fc = additionalFiles[fname] || '';
          const truncated = fc.length > 8000 ? fc.slice(0, 8000) + '\n...[truncated]' : fc;
          multiFileCtx += `\n### ${fname}\n\`\`\`\n${truncated}\n\`\`\`\n`;
        });
      }
    }

    // Pre-process backtrace
    const btLines    = backtrace.split('\n');
    const signalLine = btLines.find(l =>
      l.includes('signal') || l.includes('SIGSEGV') ||
      l.includes('SIGABRT') || l.includes('SIGFPE') || l.includes('SIGBUS')
    ) || '';
    const frameLines = btLines.filter(l => /^#\d+/.test(l.trim())).slice(0, 10).join('\n');

    // Guard source size — truncate if too large to prevent token overflow
    const MAX_SOURCE = 18000; // chars (~4500 tokens)
    const srcTruncated = source.length > MAX_SOURCE
      ? source.slice(0, MAX_SOURCE) + '\n\n...[SOURCE TRUNCATED — ' + (source.length - MAX_SOURCE) + ' chars omitted to fit token limit]'
      : source;

    if (source.length > MAX_SOURCE) {
      console.warn(`Source truncated: ${source.length} -> ${MAX_SOURCE} chars`);
    }

    const userMessage = `## CRASH SIGNAL\n${signalLine || '(see backtrace)'}\n\n` +
      `## BACKTRACE\n\`\`\`\n${frameLines || backtrace}\n\`\`\`\n\n` +
      `## FULL GDB OUTPUT\n\`\`\`\n${backtrace}\n\`\`\`\n\n` +
      `## SOURCE FILE: ${filename || 'source.cpp'}\n\`\`\`\n${srcTruncated}\n\`\`\`` +
      multiFileCtx +
      `\n\nCRITICAL: Return ONLY a valid JSON object. No text before or after the JSON. Start with { and end with }.`;

    try {
      const result = await callAnthropic(apiKey, ANALYSIS_PROMPT, userMessage, 8096);
      return respond(200, { result }, event);
    } catch (err) {
      const status = err.status || 500;
      const msg = status === 401 ? 'Invalid API key'
                : status === 402 ? 'Insufficient API credits'
                : status === 429 ? 'Rate limited — try again in 30 seconds'
                : 'Analysis failed';
      return respond(status, { error: msg, detail: err.error }, event);
    }
  }

  // ── Route: /advisor ───────────────────────────────────────────────────
  if (path === '/advisor' || path.endsWith('/advisor')) {
    const { backtrace } = body;
    if (!backtrace) return respond(400, { error: 'backtrace is required' }, event);

    const userMessage = `Analyze this GDB backtrace and identify all source files needed:\n\n\`\`\`\n${backtrace}\n\`\`\``;

    try {
      const result = await callAnthropic(apiKey, ADVISOR_PROMPT, userMessage, 1024);
      return respond(200, { result }, event);
    } catch (err) {
      return respond(err.status || 500, { error: 'Advisor failed', detail: err.error }, event);
    }
  }

  // ── Route: /chat ──────────────────────────────────────────────────────
  if (path === '/chat' || path.endsWith('/chat')) {
    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
      return respond(400, { error: 'messages array is required' }, event);
    }

    try {
      const result = await callAnthropic(apiKey, FOLLOWUP_PROMPT, messages, 2048);
      return respond(200, { result }, event);
    } catch (err) {
      return respond(err.status || 500, { error: 'Chat failed', detail: err.error }, event);
    }
  }

  // ── 404 ───────────────────────────────────────────────────────────────
  return respondError(404, 'Unknown route: ' + path, event);
};

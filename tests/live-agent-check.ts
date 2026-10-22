/**
 * LIVE end-to-end check against a running server. Uses real OpenAI and SerpApi quota
 * (about 6 searches per run), so run it by hand, not in CI.
 *
 *   BASE_URL=https://ai-agent-system-world-city-explorer.onrender.com npm run test:live
 *
 * For each prompt it checks that the agent called the expected tool, that the tool
 * reported status "ok", and that the reply is not empty. Exit code 1 if any check fails.
 */

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:4111').replace(/\/$/, '');
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const cases: Array<{ name: string; prompt: string; tool: string }> = [
  { name: 'flight prices', prompt: `Flight prices from Tokyo Haneda to London on ${inDays(30)}, one way, economy, in JPY`, tool: 'flightSearchTool' },
  { name: 'flights in Japanese', prompt: `${inDays(40)}に東京から大阪へのフライトを探して`, tool: 'flightSearchTool' },
  { name: 'hotels', prompt: `Hotels in Shinjuku, Tokyo from ${inDays(30)} to ${inDays(32)} for 2 adults, mid-range, USD`, tool: 'hotelBookingTool' },
  { name: 'weather', prompt: 'What is the weather in Kyoto right now?', tool: 'weatherTool' },
  { name: 'currency', prompt: 'Convert 50000 JPY to USD', tool: 'currencyConversionTool' },
  { name: 'web search', prompt: 'What is the current adult ticket price for teamLab Planets Tokyo?', tool: 'webSearchTool' },
];

function toolResults(body: any): Array<{ toolName: string; result: any }> {
  // Mastra returns steps[].toolResults; field names differ slightly between versions, so read both shapes.
  const steps: any[] = Array.isArray(body?.steps) ? body.steps : [];
  const fromSteps = steps.flatMap((s) => (Array.isArray(s?.toolResults) ? s.toolResults : []));
  const top = Array.isArray(body?.toolResults) ? body.toolResults : [];
  return [...fromSteps, ...top].map((t: any) => ({
    toolName: t?.toolName ?? t?.payload?.toolName,
    result: t?.result ?? t?.output ?? t?.payload?.result,
  }));
}

async function main() {
  let failed = 0;
  for (const c of cases) {
    const started = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/agents/cityAssistantAgent/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: c.prompt }] }),
        signal: AbortSignal.timeout(120_000),
      });
      const body = await res.json();
      const calls = toolResults(body).filter((t) => t.toolName === c.tool);
      const status = calls[0]?.result?.status ?? (calls.length ? 'n/a' : 'not called');
      const ok = res.ok && calls.length > 0 && (status === 'ok' || status === 'n/a' || status === 'live') && typeof body?.text === 'string' && body.text.trim().length > 0;
      if (!ok) failed++;
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name.padEnd(20)} tool=${c.tool} status=${status} http=${res.status} ${Date.now() - started}ms`);
      if (!ok) console.log(`      reply: ${String(body?.text ?? JSON.stringify(body)).slice(0, 300)}`);
    } catch (err) {
      failed++;
      console.log(`FAIL  ${c.name.padEnd(20)} ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`\n${cases.length - failed}/${cases.length} passed against ${BASE_URL}`);
  process.exit(failed ? 1 : 0);
}

main();

/**
 * Model Benchmark Engine for Nice Router
 * Performs non-destructive, lightweight performance tests on candidate models
 * to measure actual TTFT (time-to-first-token), total latency, and output throughput.
 */

const benchmarkHistory = [];

/**
 * Benchmark runner for an individual model
 *
 * @param {object} params
 * @param {string} params.provider
 * @param {string} params.model
 * @param {Function} params.executor - Async function that issues the test request
 * @param {string} [params.prompt="Say 'pong'"] - Standardized minimal probe prompt
 * @returns {Promise<object>} Benchmark metrics
 */
export async function runModelBenchmark({
  provider,
  model,
  executor,
  prompt = "Say 'pong'",
}) {
  const startTime = Date.now();
  let ttft = 0;
  let totalLatency = 0;
  let tokensGenerated = 0;
  let success = false;
  let errorMsg = null;
  let statusCode = 200;

  try {
    const res = await executor({
      prompt,
      onFirstToken: () => {
        ttft = Date.now() - startTime;
      },
    });

    totalLatency = Date.now() - startTime;
    if (ttft === 0) ttft = totalLatency; // If non-streaming or first token not emitted

    tokensGenerated = res?.tokensGenerated || (res?.content ? Math.max(1, Math.round(res.content.length / 4)) : 1);
    success = res?.success !== false && (res?.ok ?? true);
    statusCode = res?.status || (success ? 200 : 500);
  } catch (err) {
    totalLatency = Date.now() - startTime;
    success = false;
    errorMsg = err.message || String(err);
    statusCode = err.status || 500;
  }

  const durationSec = Math.max(0.001, totalLatency / 1000);
  const throughputTokensPerSec = success && tokensGenerated > 0 ? Number((tokensGenerated / durationSec).toFixed(2)) : 0;

  const result = {
    id: `bench-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    provider,
    model,
    timestamp: new Date().toISOString(),
    success,
    statusCode,
    ttftMs: ttft,
    totalLatencyMs: totalLatency,
    tokensGenerated,
    throughputTokensPerSec,
    errorMessage: errorMsg,
  };

  benchmarkHistory.push(result);
  if (benchmarkHistory.length > 100) {
    benchmarkHistory.shift();
  }

  return result;
}

/**
 * Get benchmark history for models
 */
export function getBenchmarkResults(provider = null, model = null) {
  let list = [...benchmarkHistory];
  if (provider) {
    list = list.filter((b) => b.provider.toLowerCase() === provider.toLowerCase());
  }
  if (model) {
    list = list.filter((b) => b.model.toLowerCase() === model.toLowerCase());
  }
  return list.reverse();
}

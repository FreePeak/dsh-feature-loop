# latency-window demo

`src/latency-window.ts` is the rolling latency window behind this loop's
model-escalation policy: `LatencyWindow` keeps the last N tool-call latencies
and reports nearest-rank percentiles, and `shouldEscalate` reads the p95 to
decide whether the next step is worth a stronger (pricier) model. No deps —
`node --experimental-strip-types` is the whole toolchain.

## Run the tests

```bash
node --experimental-strip-types --test demo/test/*.test.ts   # from dsh-feature-loop/
bash demo/verify.sh                                          # exit 0 only when all pass
```

## Known issue

Since we started gating escalation on the p95 of the last 20 tool calls, the
loop climbs to the expensive model far more often than the budget says it
should: a window with one slow `read` (900 ms against a 500 ms p95 budget)
escalates on the very next step, though the other 19 calls are all under
200 ms. Percentiles look wrong the same way — `p50` over an even number of
samples comes back as the *higher* of the two middle values.

The intended behaviour is in the module's doc comment and the test names.

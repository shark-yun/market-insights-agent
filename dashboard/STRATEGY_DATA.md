# Strategy room data contract

The room reads optional `strategy` from `data/report.json`. Existing reports remain supported and display pending agents. The current Python pipeline does not generate this field yet. No mock results or derived trading recommendations are substituted.

`strategy.agents` has three keys: `fundamental`, `expert`, `sentiment`. `strategy.fusion` has the same result shape, plus `disagreements` (string).

Each result accepts:

- `status`: pending, running, complete, partial, failed.
- `score`: number from 0 to 100, or null. Direction only, not confidence or probability. 0–40 bearish, above 40 and below 60 neutral, 60–100 bullish. Only complete/partial results show scores.
- `comment`, `recommendation`, `rationale`: plain text; escaped when rendered.
- `scope`, `horizon`: explicit instrument/market and analysis horizon.
- `asOf`: ISO timestamp with timezone. Results older than 48 hours are labeled stale; this is a display policy, not a market freshness guarantee.
- `sources`: array of `{title, url}`; only HTTP(S) links render.

Fusion should be generated from compatible scopes and horizons with evidence and disagreements preserved, not an automatic arithmetic average. Missing scores must remain null. Backend producers should validate these fields and persist each run before publishing. The frontend does not run agents or call an LLM.

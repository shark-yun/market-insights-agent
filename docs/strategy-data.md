# Strategy room data contract

The room reads optional `strategy` from `data/report.json`. Existing reports remain supported and display pending agents. The Python pipeline generates this field through `market_insights/strategy.py`. No mock results or derived trading recommendations are substituted.

`strategy.agents` has three keys: `fundamental`, `expert`, `sentiment`. `strategy.fusion` has the same result shape, plus `disagreements` (string).

Each result accepts:

- `status`: pending, running, complete, partial, failed.
- `score`: number from 0 to 100, or null. Direction only, not confidence or probability. 0–40 bearish, above 40 and below 60 neutral, 60–100 bullish. Only complete/partial results show scores.
- `comment`, `recommendation`, `rationale`: plain text; escaped when rendered.
- `scope`, `horizon`: explicit instrument/market and analysis horizon.
- `asOf`: ISO timestamp with timezone. Results older than 48 hours are labeled stale; this is a display policy, not a market freshness guarantee.
- `sources`: array of `{title, url}`; only HTTP(S) links render.

Fusion should be generated from compatible scopes and horizons with evidence and disagreements preserved, not an automatic arithmetic average. Missing scores must remain null. Backend producers should validate these fields and persist each run before publishing. The frontend does not run agents or call an LLM.

## Data-first UI and scheduled generation

`market_insights/strategy.py` builds metrics and dataSummary without API access. Each result includes a reason (no_key, disabled, missing_sources, quota, model_unavailable, invalid_response, partial_sources, or not_run). The frontend shows metrics first; View AI analysis reveals the score and commentary. It never invokes a model from the public browser. Open panels persist across refresh and language changes.

Scheduled runs use one bounded model request for roles with evidence. Sentiment can use real VIX and publisher headlines, while missing evidence keeps a role pending. Fusion remains pending until a complete synthesis is implemented. Model configuration uses GEMINI_MODEL (default gemini-flash-latest); enable_strategy_analysis can disable calls. No key or quota failure leaves market updates operational. Scores are model outputs, never invented as fallback.

`observation` and `watchpoints` are deterministic rule summaries shown before the AI panel; they are separate from model-generated `comment`, `recommendation` and `score`.

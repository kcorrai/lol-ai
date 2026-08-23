# ADR-006: Performance Prediction Model Architecture

## Status: Accepted

## Context

A high-value feature for LoL AI Coach is **calibrated performance predictions**: "if you improve your CS/min from 6.0 to 7.0, your win rate is likely to increase by approximately 2%." Unlike generic coaching advice, quantified predictions give players a concrete feedback loop and differentiate the product.

The question is: what approach should we use, and are we ready for it?

### Current data availability

The `performance_snapshots` table is the primary feature store:

| Feature        | Column                     | Type     | ML readiness                 |
| -------------- | -------------------------- | -------- | ---------------------------- |
| Win rate       | `winRate`                  | Decimal  | ✅ Target variable           |
| KDA            | `avgKda`                   | Decimal  | ✅ Strong predictor          |
| CS/min         | `avgCsPerMinute`           | Decimal  | ✅ Strong predictor          |
| Vision score   | `avgVisionScore`           | Decimal  | ✅ Moderate predictor        |
| Tilt score     | `tiltScore`                | Decimal? | ⚠️ Nullable (~30% fill rate) |
| Champion pool  | `mostPlayedChampionIds`    | Int[]    | ⚠️ Needs embedding           |
| Period bounds  | `periodStart`, `periodEnd` | DateTime | ✅ Temporal features         |
| Games analyzed | `gamesAnalyzed`            | Int      | ✅ Sample size weight        |

Missing features that would improve model accuracy:

- **Rank tier** — absolute skill level matters (challenger CS/min ≠ gold CS/min)
- **Position/role** — CS/min is irrelevant for supports, critical for carries
- **Champion mastery** — playing off-meta champions has confounding effect on WR
- **Server / region** — skill distribution varies by server
- **Season patch** — meta shifts change what metrics matter

These are available in `RankedHistory` and `MatchParticipant` but would require a denormalized or joined pipeline.

### Data volume requirement

Minimum data thresholds for reliable model training:

| Approach                            | Min snapshots | Min unique accounts |
| ----------------------------------- | ------------- | ------------------- |
| Rule-based (current)                | 0             | 0                   |
| Linear regression per role          | ~5,000        | ~2,000              |
| Gradient boosting (no role split)   | ~10,000       | ~5,000              |
| Gradient boosting (per-role models) | ~50,000       | ~20,000             |

Current estimate: the product launched recently — we have well under 5,000 snapshots. Statistical models would overfit or produce misleading confidence intervals at this stage.

### Prior art

Published academic research and community analyses ([op.gg data studies, League of Graphs](https://www.leagueofgraphs.com)) consistently identify the following metrics as win-rate correlated:

| Metric          | Empirical coefficient (approximate) | Source quality                            |
| --------------- | ----------------------------------- | ----------------------------------------- |
| CS/min +1       | +1.5–2% WR (ADC/Mid)                | High confidence                           |
| CS/min +1       | +0.5–1% WR (Top/Jungle)             | High confidence                           |
| Deaths/game -1  | +2–3% WR                            | High confidence                           |
| Vision score +5 | +0.4–0.8% WR (Support)              | Moderate confidence                       |
| KDA +1          | +1.5–2.5% WR                        | High confidence (circular: WR causes KDA) |

These coefficients are role-dependent and approximate — they should be treated as illustrative, not precise, until we have our own data to calibrate against.

## Decision

**Two-phase approach:**

### Phase 5 (now): Rule-based prediction service

Ship a `performancePredictionService.ts` that uses the empirical coefficients above with explicit uncertainty intervals. Key design choices:

- Predictions are **estimates with ranges**, not point predictions
- Coefficients are **role-aware** (different tables for ADC vs. Support vs. Jungle)
- The service interface is designed so that a future ML model can drop in as a replacement
- No external ML framework dependencies — pure TypeScript arithmetic

### Phase 7 (post 10k snapshots): Gradient boosting model

Once we have sufficient data, train a **LightGBM** model (via Python microservice):

- Features: all `performance_snapshots` columns + position from match history + rank tier
- Target: 28-day win rate delta (did improving metric X correlate with WR improvement?)
- Deployment: Python inference endpoint behind `/api/ml/predict-improvement`, called from the existing service interface
- Architecture: Next.js API route → internal HTTP to Python FastAPI → model inference

The model will be a **separate microservice** (not bundled into the Next.js serverless functions) to avoid cold-start bloat and enable GPU inference if needed.

### Why not LangChain / AI for predictions?

LLMs produce non-calibrated probability estimates — they will confidently say "your win rate will increase by 15%" without any statistical grounding. For a feature that claims to be quantitative, we need actual regression, not language model output.

## Data pipeline design

### Feature collection (current)

```
MatchParticipant rows
       ↓ (daily Inngest cron: performanceSnapshotWorker)
PerformanceSnapshot (7-day rolling windows)
       ↓ (future: ML training pipeline)
LightGBM model artifacts (S3/R2 bucket)
       ↓
/api/ml/predict-improvement
```

### Training pipeline (Phase 7)

1. Export `performance_snapshots` to CSV via read replica
2. Join with `ranked_history` for tier labels and `match_participants` for position
3. Compute `outcome = winRate(t+28) - winRate(t)` as regression target
4. Train per-position models with 5-fold time-series cross-validation
5. Evaluate with MAE on held-out recent data
6. Serialize model to ONNX for cross-platform inference

## Consequences

**Positive:**

- Immediate value: rule-based predictions ship now with no data dependency
- Interface is stable: upgrading to ML model later requires zero UI changes
- Transparent uncertainty: ranges are shown to users, not false precision
- Data collection is already happening via `performanceSnapshotWorker`

**Negative:**

- Rule-based coefficients are approximate and not calibrated to our user base
- Real ML requires a Python microservice — adds operational complexity
- Position data is not yet in `performance_snapshots` — rule-based predictions use conservative blended coefficients for now

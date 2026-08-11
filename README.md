# Clinical Trial Tracker — New Trial Starts by Sponsor & Condition

Search newly posted clinical trials by sponsor, condition, phase, status, or
country. A new trial start is a buying signal for CROs, lab and reagent
suppliers, and patient recruitment services — a termination is a signal too,
for competitive and risk-monitoring purposes.

Built for CRO/vendor business development tracking which sponsors are
starting trials in their therapeutic area, and biotech competitive
intelligence teams monitoring specific sponsors or conditions.

## Input

```json
{
  "condition": "oncology",
  "sponsor": "Pfizer",
  "phase": "all",
  "status": "new",
  "country": "Germany",
  "daysBack": 14,
  "maxResults": 25
}
```

| Field | Type | Description |
|---|---|---|
| `condition` | string | Medical condition to search for. Leave blank to skip. |
| `sponsor` | string | Lead sponsor organization name. Leave blank for all sponsors. |
| `phase` | string | `all`, `EARLY_PHASE1`, `PHASE1`, `PHASE2`, `PHASE3`, `PHASE4`, or `NA`. Default `all`. |
| `status` | string | `new` (recruiting/not-yet-recruiting — the trial-start signal), `all`, `completed`, or `terminated` (terminated/withdrawn/suspended — the trial-failure signal). Default `new`. |
| `country` | string | Limit to trials with at least one site in this country. |
| `daysBack` | number | How many days back from today to search, by first-posted date. Default `14`, max `90`. |
| `maxResults` | number | Max trials to return, most recently posted first. Default `25`, max `100`. |

## Output

One record per trial:

```json
{
  "nctId": "NCT07755436",
  "studyUrl": "https://clinicaltrials.gov/study/NCT07755436",
  "briefTitle": "Phase 1 Study to Assess Safety, Tolerability... in Advanced or Metastatic Ovarian or Endometrial Cancer.",
  "overallStatus": "RECRUITING",
  "phases": ["PHASE1"],
  "leadSponsor": "ArriVent BioPharma, Inc.",
  "conditions": ["Ovarian Cancer", "Endometrial Cancer"],
  "countries": ["United States"],
  "siteCount": 2,
  "briefSummary": "This is a Phase 1 study to assess safety, tolerability...",
  "studyFirstPostDate": "2026-08-10",
  "startDate": "2026-07-23"
}
```

`countries` and `siteCount` summarize the trial's location list — large
multi-national trials can have hundreds of individual sites, so raw
site-level data isn't included in the row.

## How it works

Direct calls to the official [ClinicalTrials.gov](https://clinicaltrials.gov/)
v2 API — the U.S. National Library of Medicine's public registry, no API key
required. No proxy, no login, no scraping.

## Pricing note

Billed per **search**, not per trial returned — one charge whether the
search returns 1 trial or 100.

## Related products

Looking for other early-signal or risk-monitoring actors?

- [Insider Trading Alert](https://github.com/timmKal01/insider-trading-alert) — executive stock buy/sell signals
- [Product Recall Alert](https://github.com/timmKal01/product-recall-alert) — FDA drug/food/device recalls

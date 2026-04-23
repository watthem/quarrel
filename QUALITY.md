# Quality Gates

Quarrel is intended to become a local-first open-source utility, so the quality gate favors deterministic checks over agent judgment.

Run the standard gate:

```bash
node scripts/quality-check.mjs
```

Run deeper report-only analysis:

```bash
node scripts/quality-check.mjs --analysis
```

Watch local changes continuously:

```bash
node scripts/quality-watch.mjs
```

The gate runs pinned Biome lint/format checks, the Vitest suite when available, the Fieldtest docs validation script when available, and Fallow/Knip only when `--analysis` is passed.

Do not run Fallow or Knip auto-fix commands without reviewing the report first.

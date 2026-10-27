# APC 2025 recommendations dataset — integration handoff

## Status
This branch is an isolated review branch based on `work-branch`. It is not production and must not be deployed.

## Required source files (still to be added)
- `apc_cards_dataset_v2.zip`
- `audit_report.html`
- `recommendations_audit.xlsx`

These were provided in the ChatGPT conversation but are not yet committed in this repository. Do not assume they exist in the checkout until verified. If absent, stop and report the exact missing paths; do not fabricate data or ask the user to upload them through the build agent.

## Known audit inventory from the supplied workbook
Worksheet dimensions (header included):
- recommendations: 3,483 rows (3,482 data rows)
- cards: 339 rows (338 data rows)
- actives_cas: 274 rows (273 data rows)
- uncertain: 51 rows (50 data rows)
- missing_conflicts: 645 rows (644 data rows)
- dups_same_card: 1,138 rows (1,137 data rows)
- dups_cross_card: header only
- dup_cards: 3 rows (2 data rows)
- spelling: 171 rows (170 data rows)

These counts are an initial structural inventory, not proof that all records have been manually verified against the source PDF.

## Mandatory workflow
1. Inspect repository state, current branch, working tree, and existing recommendation-data schemas before editing.
2. Confirm the three source files are present in this branch. If not, do not run conversion scripts; report missing files and stop.
3. Read the package README and SPEC before using scripts. In particular, inspect `finalize.py` before running it: it may delete/recreate a `../final` output directory. Never run destructive scripts without proving their target is isolated and safe.
4. Keep all raw sources and audit sheets unchanged. Work only in a new subdirectory such as `data/apc2025_review/`; do not overwrite existing app datasets.
5. Do not import draft recommendations into the app's production data path. First compare schema, counts, source page/order, card fields, duplicates, conflicts, and CAS confidence.
6. Keep uncertain CAS/status/rates/PHI flagged for human review. Do not infer Libyan registration/status from the Egyptian APC book.
7. Run existing tests and add data-integrity checks. Do not deploy, merge, change production configuration, or modify service-worker cache/version.
8. Report changed files, record counts, unresolved conflicts, test results, and commit SHA. If anything is missing, stop without pretending it was processed.

## Product goal
Prepare a future “بطاقة التوصيات” flow (crop → pest/infection → matching recommendation cards), but do not implement the UI until the data audit and schema mapping are approved.

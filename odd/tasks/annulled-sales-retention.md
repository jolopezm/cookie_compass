# Annulled sales retention

## Objective

Allow operators to annul mistaken sales without immediate data loss, exclude them from business calculations, retain them for 15 days, and purge them automatically while preserving a minimal audit record.

## Problem

Sales are currently read-only after the transactional `registrar_venta` RPC creates `ordenes` and `detalle_ordenes`. There is no safe correction path, and direct deletion would erase traceability and risk inconsistent order/detail state.

## Why

Operators need a reversible correction window without accumulating unusable sales indefinitely. Business metrics and delivery planning must stop counting an annulled sale immediately.

## Scope

- Add confirmed/annulled lifecycle fields to `ordenes`.
- Add transactional RPCs to annul and restore a sale during its retention window.
- Store one minimal audit row that survives sale deletion.
- Exclude annulled sales from balance, analytics, product ranking, customer cadence, and production planning.
- Schedule a daily `pg_cron` purge for sales annulled at least 15 days earlier.
- Expose annul/restore controls and status in the sales list.

## Constraints

- Do not physically delete a sale before 15 days have elapsed.
- Delete order details and orders transactionally during purge.
- Preserve stable order IDs in all joins.
- Keep `ordenes` as the source of totals and dates and `detalle_ordenes` as the source of product quantities and amounts.
- Do not create or reverse inventory movements because current sales do not affect inventory.
- Restrict RPC execution and direct table access explicitly.
- The deployment owner must validate that 15-day retention satisfies applicable accounting requirements.
- Preserve unrelated local changes in `.gitignore` and `BIGPICKLE.md`.

## Research evidence

- Supabase documents enabling `pg_cron` with `create extension pg_cron with schema pg_catalog` and scheduling named recurring jobs with `cron.schedule`.
- Reusing a cron job name overwrites its schedule, making the migration repeatable for the named purge job.
- Source: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/cron/install.mdx
- Source: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/cron/quickstart.mdx

## Delivery

- Strategy: `ask-on-risk`
- Chain strategy: `feature-branch-chain` (user-selected).
- Forecast: revised from approximately 350 to approximately 560 authored changed lines after the transactional SQL lifecycle was fully specified. The migration is one atomic behavior and will not be split artificially.
- Slice 1: T1 backend lifecycle and domain safety. `size:exception` accepted because the 352-line migration is one transactional security boundary and splitting it would make intermediate states unsafe.
- Slice 2: T2 application controls, dependent on Slice 1.
- Review boundary: branch point `0986aef`.

## Tasks

- [ ] **T1 — Add transactional annulment and retention backend**
  - Route: delegated direct.
  - Trigger: migration, repository contract, domain filtering, tests, and documentation span multiple non-trivial files.
  - Authorized scope: `supabase/migrations/20261007000100_add_sale_annulment_retention.sql`, `src/js/repository.js`, `src/js/domain.js`, `src/js/domain.test.js`, `README.md`.
  - Acceptance criteria:
    - Annul and restore operations are transactional, authenticated, and state-validating.
    - Annulled sales are ignored by all existing domain calculations.
    - Minimal audit evidence survives physical deletion.
    - A named daily cron job purges eligible sales after 15 days.
  - Checks: `npm test`, `npm run build`, `git diff --check`.
  - Verification evidence: worker observed `npm test` passing 7/7, `npm run build` passing, and `git diff --check` passing; parent spot-check observed `npm test` passing 7/7. Independent verification found and then confirmed fixes for direct table-write bypass and fail-open orphan detail filtering.
  - Test-first evidence: RED showed annulled sales changing cadence and monthly revenue and orphan details surviving filtering; GREEN passed 7/7 after explicit current-sale filtering and RPC-only sale writes.
  - SQL evidence: structural checks passed for transaction boundaries, row locks, authorization, state constraints, RLS, grants/revokes, detail-before-order purge, 15-day cutoff, and named cron schedule. Database execution remains unavailable locally.
  - Commit evidence: pending.
  - Review outcome: pending.

- [ ] **T2 — Add sales annulment controls**
  - Route: delegated direct.
  - Trigger: UI behavior and responsive styling span multiple non-trivial files.
  - Authorized scope: `src/App.jsx`, `src/css/custom.css`.
  - Acceptance criteria:
    - Confirmed sales can be annulled with a required reason and explicit confirmation.
    - Annulled sales remain visible with their status and purge deadline.
    - Annulled sales can be restored before purge.
    - Controls are keyboard-accessible and await persistence before success feedback.
  - Checks: `npm test`, `npm run build`, `git diff --check`.
  - Verification evidence: pending.
  - Commit evidence: pending.
  - Review outcome: pending.

## Progress

- Current task: T1.
- Running authored line count: approximately 460 backend/source/test lines before task-document updates, exceeding the 400-line delivery budget because the atomic migration defines the complete lifecycle, security boundary, audit record, and scheduler.

## Next step

Create the T1 work-unit commit as Slice 1, assess its native review requirement, and record the commit evidence before starting T2.

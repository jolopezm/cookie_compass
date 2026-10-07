# Historical monthly analytics

## Objective

Allow operators to select a past month and view the analytics metrics that already exist, all scoped to the same monthly period.

## Problem

The Analytics screen currently fixes its summary to the current month and only shows the previous month as comparison text. Its product ranking is accumulated across all loaded detail rows, so it does not match the monthly summary.

## Why

Operators need to review prior months without introducing new KPIs or exporting data manually. Every metric shown together must use the same time boundary.

## Scope

- Add an accessible month/year selector to Analytics.
- Show total revenue, unique sales, average ticket, and previous-month comparison for the selected month.
- Filter the existing product ranking to orders from the selected month.
- Preserve the current visual language and empty states.

## Constraints

- Do not add metrics, dependencies, routes, or database changes.
- Use `ordenes` as the source of monthly totals and dates.
- Use `detalle_ordenes` and `productos` for product quantities and amounts.
- Count sales by unique order ID.
- Preserve unrelated local changes in `.gitignore` and `BIGPICKLE.md`.

## Delivery

- Strategy: `ask-on-risk`
- Forecast: approximately 100 authored changed lines.
- Review boundary: branch point `0986aef`.

## Tasks

- [ ] **T1 — Add selectable historical monthly analytics**
  - Route: delegated direct.
  - Trigger: behavior and deterministic coverage span the Analytics UI and domain aggregation across multiple non-trivial files.
  - Authorized scope: `src/App.jsx`, `src/css/custom.css`, `src/js/domain.js`, `src/js/domain.test.js`.
  - Acceptance criteria:
    - Operators can select a month and year.
    - Revenue, unique sales, average ticket, and comparison use the selected month.
    - Product ranking includes only details belonging to orders in the selected month.
    - Changing the period does not mutate raw business data.
  - Checks: `npm test`, `npm run build`, `git diff --check`.
  - Verification evidence: worker observed `npm test` passing 6/6, `npm run build` passing with 62 modules, and `git diff --check` passing; parent spot-check observed `npm test` passing 6/6.
  - Test-first evidence: RED failed because `summarizeProductSales` was not exported; GREEN passed after implementing monthly order-ID aggregation; refactoring retained year-boundary, mixed-ID, sorting, immutability, and empty-period coverage.
  - Commit evidence: pending.
  - Review outcome: pending.

## Progress

- Current task: T1.
- Running authored line count: 138 implementation/test lines before task-document updates; above forecast but below the 400-line delivery budget.

## Next step

Create the T1 work-unit commit, assess its native review requirement, and record the commit evidence.

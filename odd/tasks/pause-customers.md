# Pause customers

## Objective

Allow operators to pause and reactivate customers without deleting their records, while keeping paused customers out of upcoming delivery and production planning.

## Problem

The domain and database already support `clientes.activo`, but the customer administration UI does not expose that state. Operators currently must either keep dormant customers in planning or delete them and lose a safe reactivation path.

## Why

Customer history must remain available even when a customer temporarily stops ordering. A reversible status preserves history and avoids false delivery projections.

## Scope

- Show whether each customer is active or paused in the customer list.
- Add an accessible action to pause or reactivate a customer.
- Persist the state through the existing customer update operation.
- Verify that paused customers remain excluded from delivery and production planning.

## Constraints

- Do not delete customer records or historical sales.
- Do not change the database schema or dependencies.
- Preserve existing customer edit and delete actions.
- Keep the React component architecture and current visual language.
- Preserve unrelated local changes in `.gitignore` and `BIGPICKLE.md`.

## Delivery

- Strategy: `ask-on-risk`
- Forecast: approximately 60 authored changed lines.
- Review boundary: branch point `0986aef`.

## Tasks

- [ ] **T1 — Add reversible customer status controls**
  - Route: delegated direct.
  - Trigger: implementation spans UI behavior, styling, and a domain regression test across multiple non-trivial files.
  - Authorized scope: `src/App.jsx`, `src/css/custom.css`, `src/js/domain.test.js`.
  - Acceptance criteria:
    - Active customers can be paused from the customer list.
    - Paused customers remain listed and can be reactivated.
    - The current state and action are understandable to assistive technology.
    - Paused customers do not contribute deliveries or production quantities.
  - Checks: `npm test`, `npm run build`, `git diff --check`.
  - Verification evidence: worker observed `npm test` passing 5/5, `npm run build` passing, and `git diff --check` passing; parent spot-check observed `npm test` passing 5/5.
  - Test-first evidence: the new inactive-customer test passed immediately because the domain filter already existed, so it serves as characterization coverage rather than an invented RED.
  - Commit evidence: pending.
  - Review outcome: pending.

## Progress

- Current task: T1.
- Running authored line count: 43 implementation/test lines before task-document updates.

## Next step

Create the T1 work-unit commit, assess its native review requirement, and record the commit evidence.

# EIS Testing Guide

## Backend (Node/TypeScript)

### Unit tests
```bash
npm test
```
- Runs Jest on `tests/**/*.test.ts`
- **7 tests** in 2 suites: `dashboard.handler`, `kpi.service`
- Uses mocks for DynamoDB and services; no AWS required

### Integration tests
```bash
npm run test:integration
```
- Config: `jest.integration.config.js` (pattern: `**/*.integration.test.ts`)
- Currently **no integration tests**; script passes with `--passWithNoTests`
- Add tests under `tests/` with `.integration.test.ts` for LocalStack or test AWS

### Coverage
```bash
npm run test:coverage
```
- Same as `npm test` plus Istanbul coverage report
- Enforces minimum thresholds (statements, branches, lines, functions)
- Thresholds are set so current suite passes; increase as you add tests

### Pre-deploy recommendation
Before deploying (e.g. dev), run:
```bash
npm install
npm test
npm run test:integration
npm run test:coverage   # optional
```

## Frontend (React/Vite)

- **Unit / component tests:** `cd frontend && npm test` (Vitest)
- **E2E:** `cd frontend && npm run test:e2e` (Playwright; requires app running or CI)

Run `npm install` in `frontend/` first if needed.

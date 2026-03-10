# Analysis of 4 Word Documents & Code Improvements

This document summarizes the analysis of the four EIS reference documents and the code changes made to align the codebase with them.

---

## Documents Analyzed

| Document | Purpose | Key Content Used |
|----------|---------|------------------|
| **UoB_EIS_API_Documentation.docx** | API contract, errors, rate limits, query params | GET /kpis/:id params, 429/retryAfter, response format |
| **UoB_EIS_Technical_Design_Document.docx** | Component design, handlers, data model | Architecture, handler patterns, Dashboard/KPI/Alert specs |
| **UoB_EIS_Architecture_Document_Investor.docx** | High-level architecture, APIs, roles | Response format, error shape, component layout |
| **UoB_EIS_User_Guide_Admin_Manual.docx** | UX, dashboard layout, filters, roles | Period/category filters, summary cards, dark mode |

---

## Findings vs. Code (Before Changes)

### 1. API Documentation

- **Response format** – Code already matched: `success`, `data`, `meta` with `requestId`, `timestamp`, `version`.
- **Error format** – Validation errors already return `details` as `[{ field, message }]` via `ValidationError` and `handleError`.
- **GET /kpis/{kpiId}** – API doc specifies:
  - `includeHistory` (boolean, default true)
  - `historyLimit` (integer, default 30)
  - Code always fetched history with limit 30 and had no way to omit history.
- **429 Rate limiting** – Doc specifies `RATE_LIMITED`, message, optional `retryAfter` in body and `Retry-After` header. Code had `ERROR_CODES.RATE_LIMITED` and `HTTP_STATUS.TOO_MANY_REQUESTS` but no helper to return 429 with `retryAfter`.
- **Period values** – Doc and User Guide: `daily`, `weekly`, `monthly`, `quarterly`, `yearly`. Code already had these in `dashboardQuerySchema` and `getPeriodStart`.

### 2. Technical Design Document

- Handler/service/repository layering and Cognito auth already aligned.
- Dashboard request with `period` and `category` already validated and passed through.
- Single-table DynamoDB and history stored as separate rows already reflected (and dashboard history enrichment was added in a previous fix).

### 3. Architecture Document

- Success/error response shape and API layer description matched existing implementation.
- No code changes required for the sections reviewed.

### 4. User Guide & Admin Manual

- Dashboard layout (summary cards, filter panel, KPI cards) and period/category options match current frontend and backend (period/category in dashboard API).
- Dark mode and theme handling already implemented in ThemeContext.
- No additional code changes from this doc for the scope of this pass.

---

## Code Improvements Implemented

### 1. GET /kpis/{kpiId} query parameters (API Documentation)

- **KPI service** – `getKPIById(kpiId, options?)` now accepts:
  - `includeHistory`: if `false`, `history` is set to `[]` and no history is fetched.
  - `historyLimit`: cap for history points (default 30, max 100).
- **Validation** – New `kpiDetailQuerySchema`:
  - `includeHistory`: from query string; default behavior is true (param absent or not `"false"`/`"0"`).
  - `historyLimit`: coerced number, 1–100, default 30.
- **KPIs handler** – For `GET /kpis/:kpiId`, query params are validated with `kpiDetailQuerySchema` and passed into `getKPIById` so behavior matches the API doc.

### 2. 429 rate limit response (API Documentation)

- **Response helper** – In `response.util.ts`:
  - `rateLimited(message?, retryAfterSeconds?, requestId?)`:
    - Returns status 429.
    - Body uses error code `RATE_LIMITED` and can include `details: { retryAfter }` when `retryAfterSeconds` is provided.
    - Sets `Retry-After` header when `retryAfterSeconds` is provided.
- **Constants** – `ERROR_CODES.RATE_LIMITED` and `HTTP_STATUS.TOO_MANY_REQUESTS` were already present; no constant changes.
- Handlers can now call `ResponseUtil.rateLimited('Too many requests.', 60, requestId)` when rate limiting is enforced (e.g. by API Gateway or a future in-Lambda limiter).

### 3. Cleanup

- Removed stray text `"4. UTILITIES"` from `src/constants/api.constants.ts`.
- Used `ERROR_CODES.RATE_LIMITED` in the new `rateLimited` helper for consistency.

---

## Recommendations (Not Implemented)

- **Rate limiting enforcement** – API doc defines limits (e.g. 100/min dashboard, 200/min KPIs). Enforcement is typically done in API Gateway (usage plan/throttle) or a shared Lambda authorizer. The new `rateLimited` helper is ready for when 429 responses are returned from the application layer.
- **Rate limit response headers** – Doc mentions `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. These are usually set by API Gateway or a gateway plugin; can be added to responses later if limits are implemented in Lambda.
- **GET /kpis list filter by status** – API doc mentions filtering by `status` (e.g. `on_target`, `at_risk`, `below_target`). Current list endpoint filters by `category` and pagination only; adding optional `status` filter would align with the doc.
- **PATCH vs PUT** – API doc mentions PATCH for partial updates. Current API uses PUT for updates; adding PATCH (or documenting that PUT is partial) can be a follow-up.

---

## File Change Summary

| File | Change |
|------|--------|
| `src/constants/api.constants.ts` | Removed trailing garbage line |
| `src/services/kpi.service.ts` | `getKPIById` accepts optional `includeHistory` and `historyLimit` |
| `src/utils/validation.util.ts` | Added `kpiDetailQuerySchema` for GET /kpis/:id query params |
| `src/handlers/kpis.handler.ts` | GET /kpis/:kpiId validates query and passes options to `getKPIById` |
| `src/utils/response.util.ts` | Added `rateLimited()` helper; use of `ERROR_CODES.RATE_LIMITED` |

These updates align the implementation with the API Documentation and keep the codebase consistent with the Technical Design, Architecture, and User Guide documents.

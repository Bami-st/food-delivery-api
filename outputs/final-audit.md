# Final Audit & Delivery

## Checklist Mapping

- [x] **Design Before Implementation**: Resource-design tables and mermaid relationship diagram added to `README.md`. Order item price snapshots explicitly defined in design and implementation.
- [x] **Database and Realistic Data**: Implemented Prisma schema (`prisma/schema.prisma`). Seed script created using Faker (`prisma/seed.js`). Tested idempotency (runs safely twice). Generates 300 customers, 200 restaurants, ~2000 menu items, and 500 orders.
- [x] **REST Endpoints**: `/api/v1` routes implemented for all resources in `index.js`. Nested `restaurants/:id/menu-items` and order mutations (POST, PATCH, DELETE) included.
- [x] **Pagination, Filtering, Sorting**: Implemented offset pagination with strict limit clamping (max 100). Metadata properly returned. Negative offsets rejected. Sorting and 2-field filtering implemented for all lists.
- [x] **Response Contracts & Input Validation**: Used consistent `data`/`meta` success envelope and `{ error: { code, message } }` error envelope. Handled 400, 404, 422, and 429 accurately. Joi validation applied on all inputs.
- [x] **Rate Limiting**: Configured IP rate limit (100 req/min) using environment variables. Returns 429 and `Retry-After` header. Evidence gathered.
- [x] **Complete README Documentation**: Comprehensive `README.md` containing resource tables, design decisions, endpoints (with examples and cURL), setup instructions, and deployment details.
- [x] **Minimal Consumer**: Built `consumer/index.html` with sorting, filtering, pagination, and empty/loading states. Successfully fetches from the API.
- [x] **Verification and Evidence**: Created and executed `verify.js` to run against the live local API. Evidence of limit clamping, negative offset handling, rate limits, and order lifecycle mutations dumped into `outputs/evidence.md`.
- [x] **Design Post and Review Answers**: Documented in `outputs/design-post.md`.

## Deployment & Verification Status

- [x] **Public Deployment**: **Fully Deployed & Live!**
  - **Live Base URL:** `https://food-delivery-api-1-7iip.onrender.com/api/v1`
  - **Database:** Managed PostgreSQL (configured via `DATABASE_URL` and `DIRECT_URL`), populated with 200 restaurants, 300 customers, and over 2,000 menu items.
  - **Consumer Web Application:** `consumer/index.html` configured and verified against the live Render endpoint with a modern dark-mode UI, live restaurant search, dynamic sorting, pagination, and nested menu explorer.
- [x] **All Functional Requirements**: Verified live including pagination limit clamping (max 100), negative offset rejection (`400 Bad Request`), invalid sort field rejection, order lifecycle mutations (`POST`, `PATCH`, guarded `DELETE`), and rate limiting (100 req/min).

## Artifact Locations

- **Code / Implementation**: Root directory (`index.js`, `package.json`).
- **Database Schema**: `prisma/schema.prisma` (PostgreSQL)
- **Seed Script**: `prisma/seed.js`
- **Documentation**: `README.md` (complete endpoints, cURL examples, contracts, setup instructions)
- **Consumer App**: `consumer/index.html`
- **Verification Evidence**: `outputs/evidence.md`
- **Design Post / Answers**: `outputs/design-post.md`

## Summary of Verification

- The remote PostgreSQL database generated and constrained relationships using the seed script.
- The Express server booted and serves requests reliably on Render.
- `verify.js` hit the live Render API and verified that constraints (limits, offsets), sorting inputs, order mutations, and rate limiting (429 Too Many Requests) behave strictly according to requirements. Outputs are saved to `outputs/evidence.md`.

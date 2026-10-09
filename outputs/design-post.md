# Design Post: Why We Clamp Oversized Page Requests

When building a public REST API, developers often expose a `limit` parameter to allow clients to control page sizes. However, allowing arbitrarily large page sizes (e.g., `?limit=50000`) is a recipe for disaster.

In our Food Delivery API, we enforce a strict upper bound: **a requested limit above 100 is clamped to 100**.

### The Rationale

1.  **Memory Protection**: Large database queries require significant memory to serialize into JSON. Uncapped limits allow malicious or buggy clients to trigger Out-Of-Memory (OOM) crashes on your Node.js server.
2.  **Database Performance**: Scanning and returning 50,000 records locks up database connections and degrades performance for all other users.
3.  **Predictable Latency**: Enforcing a max page size guarantees that every API response returns within a predictable time window, ensuring a smooth experience.

If a client needs 5,000 records, they simply traverse the pagination metadata (`offset += 100`) 50 times. This spreads the load efficiently.

---

### Example

Try it against our live API! The following `curl` command attempts to fetch 5,000 restaurants, but the API gracefully clamps it to 100, as shown in the `meta` object.

```bash
curl -s "http://localhost:3000/api/v1/restaurants?limit=5000" | grep '"meta"' -A 4
```
*(Note: Replace `localhost:3000` with the actual public URL once deployed!)*

---

## Review Answers

**1. Why choose cursor or offset pagination, and when would the other be better?**
Offset pagination was chosen for this API because it trivially supports dynamic sorting across multiple fields (e.g., sorting by `name`, `createdAt`, `priceCents`). Cursor pagination provides better performance on massive datasets and guarantees stability (no skipped/duplicated items when rows are inserted/deleted during pagination). However, cursor pagination requires the sorted fields to have unique indexes and complex WHERE clauses. Cursor is better for infinite-scroll feeds (like Twitter), while Offset is better for admin dashboards or search pages where users want to jump to a specific page or sort by random attributes.

**2. What happens when a client requests results beyond the end of the collection?**
The API returns a `200 OK` with an empty `data` array (`[]`). The `meta` envelope will accurately reflect the requested limit and offset, and indicate `"hasNextPage": false`.

**3. Where are the rate-limit numbers configured, and why?**
They are configured via environment variables (`RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`) loaded in `index.js`. Moving these to configuration rather than hardcoding them in route handlers allows operators to adjust limits for different environments (e.g., lower limits for a public demo, higher limits for production) without altering the codebase.

**4. How can a new restaurant field be added without breaking existing clients?**
We can add a new column to the `Restaurant` table in the database and Prisma schema. Since the API returns a JSON representation of the object, old clients will simply ignore the new, unrecognised key in the JSON response payload. If the field fundamentally changes behavior, we can version the API (`/api/v2/restaurants`), but for simple additions, the current `/v1` remains backward-compatible.

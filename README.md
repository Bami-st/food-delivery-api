# Food Delivery REST API

A production-grade, versioned REST API for food delivery built with TypeScript, Express, Prisma, and PostgreSQL/SQLite. Featuring cursor-based pagination, dynamic filtering, sorting, centralized Zod validation, configuration-driven rate limiting, and relational data modeling.

---

## 1. Quick Start & Setup

Clone the repository and run the API locally using only these instructions:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Generate Prisma client & initialize database schema
npm run db:generate
npm run db:push

# 4. Seed 2,100 deterministic records
npm run db:seed

# 5. Run test suite
npm test

# 6. Start the development server
npm run dev
```

The API will be live at `http://localhost:3000/api/v1`.

---

## 2. Design Decisions

### Why These Resources?
We selected **Restaurants**, **MenuItems**, **Customers**, and **Orders** (plus relational `OrderItems`) because they model real-world business transactions with clear relational hierarchies:
- A `Restaurant` owns many `MenuItems`.
- A `Customer` places an `Order`.
- An `Order` belongs to one `Customer` and one `Restaurant`, and contains snapshot items referencing `MenuItems`.
- This domain naturally demonstrates nested collection endpoints (`GET /api/v1/restaurants/:id/menu`) and stateful mutations (`POST /orders`, `PATCH /orders/:id`, `DELETE /orders/:id`).

### Why Generated Identifiers (Never Sequential Integers)?
All resources use non-sequential, collision-resistant string IDs prefixed with their entity type (e.g. `rest_clx...`, `menu_clx...`, `cust_clx...`, `ord_clx...`).
- **Security:** Sequential integer IDs (e.g., `1, 2, 3`) allow attackers to enumerate the entire database by incrementing integers in a loop and reveal business metrics (e.g., how many orders are placed per day).
- **Self-Documenting:** Entity prefixes immediately communicate resource types in URLs and logs.

### Why Cursor Paging Over Offset Paging?
We implemented **cursor-based pagination** (with optional offset support):
- **The Problem with Offset Paging (`?offset=40&limit=20`):** As the dataset grows into hundreds of thousands of rows, offset pagination forces the database to scan and discard all skipped rows ($O(N)$ complexity). Furthermore, offset paging suffers from **page drift**: if a new record is inserted on page 1 while a user is browsing page 2, the user sees duplicate records or misses records entirely when moving to page 3.
- **Why Cursor Paging Wins:** Cursor paging passes a pointer (`?cursor=rec_123`) from the last retrieved item. The database uses an indexed comparison (`WHERE id > cursor LIMIT 20`), executing in $O(1)$ constant time regardless of how deep the client paginates.
- **Trade-off Considered:** Cursor paging does not allow jumping directly to arbitrary pages (e.g., "Jump to Page 15"). For public APIs and infinite-scroll consumers, cursor paging is universally preferred.

### What Is the Envelope and Why?
Every response uses a unified envelope structure:
- **Collection Envelope:** `{ "data": [...], "meta": { "total": 200, "limit": 20, "nextCursor": "...", "hasMore": true } }`
- **Item Envelope:** `{ "data": { ... } }`
- **Error Envelope:** `{ "error": { "code": "NOT_FOUND", "message": "...", "details": [...] } }`

**Why:** A standardized envelope decouples client code from API changes. Clients always extract the primary payload from `res.data` and pagination state from `res.meta`, ensuring zero ambiguity across all endpoints.

---

## 3. Data Model & Architecture

```
  +------------------------+             +------------------------+
  |       Customer         |             |       Restaurant       |
  +------------------------+             +------------------------+
  | id (PK: cust_*)        |             | id (PK: rest_*)        |
  | name                   |             | name                   |
  | email                  |             | cuisine                |
  | phone                  |             | city, rating, isOpen   |
  +-----------+------------+             +-----------+------------+
              |                                      |       |
              | 1                                    | 1     | 1
              |                                      |       |
              | has many                             |       | has many
              |                                      |       |
              v N                                  N v       v N
  +------------------------+             +------------------------+
  |         Order          |             |        MenuItem        |
  +------------------------+             +------------------------+
  | id (PK: ord_*)         |             | id (PK: menu_*)        |
  | customerId (FK) >------+             | restaurantId (FK) >----+
  | restaurantId (FK) >----+             | name, category         |
  | status, totalAmount    |             | priceInCents           |
  | items [OrderItem]      |             | isAvailable            |
  +------------------------+             +------------------------+
```

---

## 4. Complete Endpoint Reference

All endpoints start with `/api/v1/`.

---

### A. Restaurants

#### 1. List Restaurants
- **Method:** `GET`
- **Path:** `/api/v1/restaurants`
- **Query Parameters:**
  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `limit` | integer | `20` | Max items to return (clamped to max `100`) |
  | `cursor` | string | `null` | Item ID cursor for next page |
  | `offset` | integer | `0` | Number of items to skip |
  | `cuisine` | string | `null` | Filter by cuisine (e.g. `Italian`, `Japanese`, `Mexican`) |
  | `city` | string | `null` | Filter by city (e.g. `Austin`, `New York`, `Chicago`) |
  | `minRating` | float | `null` | Filter by minimum rating (`1.0` to `5.0`) |
  | `isOpen` | boolean | `null` | Filter by acceptance status (`true`/`false`) |
  | `sort` | string | `createdAt` | Sort field: `name`, `rating`, `createdAt` |
  | `order` | string | `desc` | Sort direction: `asc`, `desc` |

**Example curl:**
```bash
curl -X GET "http://localhost:3000/api/v1/restaurants?cuisine=Italian&minRating=4.0&limit=2"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "rest_n0uqd027iqflhjup",
      "name": "Wiegand LLC Trattoria",
      "cuisine": "Italian",
      "address": "742 Evergreen Terrace",
      "city": "Austin",
      "rating": 4.8,
      "isOpen": true,
      "createdAt": "2026-03-12T14:20:00.000Z",
      "updatedAt": "2026-09-28T21:00:00.000Z"
    },
    {
      "id": "rest_p2kzd019xlaerqwb",
      "name": "Romaguera Trattoria",
      "cuisine": "Italian",
      "address": "104 Main Street",
      "city": "Austin",
      "rating": 4.5,
      "isOpen": true,
      "createdAt": "2026-04-10T10:15:00.000Z",
      "updatedAt": "2026-09-28T21:00:00.000Z"
    }
  ],
  "meta": {
    "total": 18,
    "limit": 2,
    "nextCursor": "rest_p2kzd019xlaerqwb",
    "hasMore": true
  }
}
```

---

#### 2. Get Restaurant by ID
- **Method:** `GET`
- **Path:** `/api/v1/restaurants/:id`

**Example curl:**
```bash
curl -X GET "http://localhost:3000/api/v1/restaurants/rest_n0uqd027iqflhjup"
```

**Example Response:**
```json
{
  "data": {
    "id": "rest_n0uqd027iqflhjup",
    "name": "Wiegand LLC Trattoria",
    "cuisine": "Italian",
    "address": "742 Evergreen Terrace",
    "city": "Austin",
    "rating": 4.8,
    "isOpen": true,
    "createdAt": "2026-03-12T14:20:00.000Z",
    "updatedAt": "2026-09-28T21:00:00.000Z",
    "_count": {
      "menuItems": 5,
      "orders": 12
    }
  }
}
```

---

#### 3. Get Restaurant Menu (Nested Endpoint)
- **Method:** `GET`
- **Path:** `/api/v1/restaurants/:id/menu`
- **Query Parameters:**
  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `limit` | integer | `20` | Max items to return |
  | `cursor` | string | `null` | Cursor pointer |
  | `category` | string | `null` | `Appetizers`, `Mains`, `Sides`, `Desserts`, `Beverages` |
  | `maxPrice` | integer | `null` | Filter items $\le$ max price in cents |
  | `isAvailable` | boolean | `null` | Availability filter |
  | `sort` | string | `createdAt` | `name`, `priceInCents`, `createdAt` |
  | `order` | string | `desc` | `asc`, `desc` |

**Example curl:**
```bash
curl -X GET "http://localhost:3000/api/v1/restaurants/rest_n0uqd027iqflhjup/menu?category=Mains&sort=priceInCents&order=asc"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "menu_837kzq02hplqwe12",
      "restaurantId": "rest_n0uqd027iqflhjup",
      "name": "Handmade Tagliatelle al Tartufo (Mains)",
      "description": "Fresh egg pasta tossed with black truffle butter and aged parmesan.",
      "category": "Mains",
      "priceInCents": 1850,
      "isAvailable": true,
      "createdAt": "2026-02-15T12:00:00.000Z",
      "updatedAt": "2026-09-28T21:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 20,
    "nextCursor": null,
    "hasMore": false
  }
}
```

---

### B. Menu Items

#### 1. List All Menu Items
- **Method:** `GET`
- **Path:** `/api/v1/menu-items`
- **Query Parameters:** `category`, `minPrice`, `maxPrice`, `isAvailable`, `sort`, `order`, `limit`, `cursor`, `offset`.

**Example curl:**
```bash
curl -X GET "http://localhost:3000/api/v1/menu-items?category=Desserts&maxPrice=1200&limit=1"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "menu_991akldjfa8234kl",
      "restaurantId": "rest_n0uqd027iqflhjup",
      "name": "Classic Tiramisu (Desserts)",
      "description": "Espresso-soaked ladyfingers layered with mascarpone cream.",
      "category": "Desserts",
      "priceInCents": 950,
      "isAvailable": true,
      "createdAt": "2026-01-20T10:00:00.000Z",
      "updatedAt": "2026-09-28T21:00:00.000Z",
      "restaurant": {
        "id": "rest_n0uqd027iqflhjup",
        "name": "Wiegand LLC Trattoria",
        "cuisine": "Italian",
        "city": "Austin"
      }
    }
  ],
  "meta": {
    "total": 195,
    "limit": 1,
    "nextCursor": "menu_991akldjfa8234kl",
    "hasMore": true
  }
}
```

#### 2. Get Menu Item by ID
- **Method:** `GET`
- **Path:** `/api/v1/menu-items/:id`

**Example curl:**
```bash
curl -X GET "http://localhost:3000/api/v1/menu-items/menu_991akldjfa8234kl"
```

---

### C. Customers

#### 1. List Customers
- **Method:** `GET`
- **Path:** `/api/v1/customers`
- **Query Parameters:** `search`, `city`, `sort` (`name`, `email`, `createdAt`), `order`, `limit`, `cursor`, `offset`.

**Example curl:**
```bash
curl -X GET "http://localhost:3000/api/v1/customers?city=Austin&limit=2"
```

#### 2. Get Customer by ID
- **Method:** `GET`
- **Path:** `/api/v1/customers/:id`

**Example curl:**
```bash
curl -X GET "http://localhost:3000/api/v1/customers/cust_n0uqd027iqflhjup"
```

---

### D. Orders (Full CRUD)

#### 1. List Orders
- **Method:** `GET`
- **Path:** `/api/v1/orders`
- **Query Parameters:** `customerId`, `restaurantId`, `status` (`PENDING`, `CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`), `sort`, `order`, `limit`, `cursor`, `offset`.

**Example curl:**
```bash
curl -X GET "http://localhost:3000/api/v1/orders?status=PENDING&limit=1"
```

---

#### 2. Create Order (POST)
- **Method:** `POST`
- **Path:** `/api/v1/orders`
- **Request Body:**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `customerId` | string | Yes | Customer ID (`cust_*`) |
  | `restaurantId` | string | Yes | Restaurant ID (`rest_*`) |
  | `deliveryAddress` | string | Yes | Delivery location |
  | `notes` | string | No | Optional special instructions |
  | `items` | array | Yes | Array of `{ menuItemId, quantity }` |

**Example curl:**
```bash
curl -X POST "http://localhost:3000/api/v1/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust_n0uqd027iqflhjup",
    "restaurantId": "rest_n0uqd027iqflhjup",
    "deliveryAddress": "500 Congress Ave, Austin, TX",
    "notes": "Please include extra napkins",
    "items": [
      { "menuItemId": "menu_837kzq02hplqwe12", "quantity": 2 }
    ]
  }'
```

**Example Response (201 Created):**
```json
{
  "data": {
    "id": "ord_990184abcdefghij",
    "customerId": "cust_n0uqd027iqflhjup",
    "restaurantId": "rest_n0uqd027iqflhjup",
    "status": "PENDING",
    "totalAmountInCents": 3700,
    "deliveryAddress": "500 Congress Ave, Austin, TX",
    "notes": "Please include extra napkins",
    "createdAt": "2026-09-28T21:15:00.000Z",
    "updatedAt": "2026-09-28T21:15:00.000Z",
    "items": [
      {
        "id": "item_12345678abcdefgh",
        "orderId": "ord_990184abcdefghij",
        "menuItemId": "menu_837kzq02hplqwe12",
        "name": "Handmade Tagliatelle al Tartufo (Mains)",
        "quantity": 2,
        "unitPriceInCents": 1850
      }
    ]
  }
}
```

---

#### 3. Get Order by ID
- **Method:** `GET`
- **Path:** `/api/v1/orders/:id`

**Example curl:**
```bash
curl -X GET "http://localhost:3000/api/v1/orders/ord_990184abcdefghij"
```

---

#### 4. Partial Update Order (PATCH)
- **Method:** `PATCH`
- **Path:** `/api/v1/orders/:id`
- **Request Body (at least one field required):**
  | Field | Type | Description |
  | :--- | :--- | :--- |
  | `status` | string | `PENDING`, `CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED` |
  | `deliveryAddress` | string | Updated delivery address |
  | `notes` | string | Updated delivery notes |

**Example curl:**
```bash
curl -X PATCH "http://localhost:3000/api/v1/orders/ord_990184abcdefghij" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONFIRMED",
    "notes": "Door code is #4040"
  }'
```

---

#### 5. Delete Order (DELETE)
- **Method:** `DELETE`
- **Path:** `/api/v1/orders/:id`

**Example curl:**
```bash
curl -X DELETE "http://localhost:3000/api/v1/orders/ord_990184abcdefghij"
```

**Example Response (200 OK):**
```json
{
  "data": {
    "id": "ord_990184abcdefghij",
    "deleted": true,
    "message": "Order 'ord_990184abcdefghij' successfully deleted"
  }
}
```

---

## 5. Error Responses & Honest Status Codes

All errors return the standard error envelope:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description of error",
    "details": []
  }
}
```

### HTTP Status Code Matrix:
- `200 OK`: Successful read or update.
- `201 Created`: Successful creation.
- `400 Bad Request`: Invalid query parameters, bad cursor, negative offset, or unknown sort field.
- `404 Not Found`: Entity with the given ID does not exist.
- `422 Unprocessable Entity`: Request body is missing required fields or references invalid entities.
- `429 Too Many Requests`: Rate limit of 100 requests/minute exceeded (includes `Retry-After` header).
- `500 Internal Server Error`: Unhandled server exception.

---

## 6. Rate Limiting Configuration

Configured in `src/config/index.ts`:
- **Window:** 60,000 ms (1 minute)
- **Max Requests:** 100 per window per IP
- Exceeding the limit returns `429 Too Many Requests` with header `Retry-After: 60`.

# Food Delivery API

A standalone REST API for a food-delivery market, backed by managed PostgreSQL.

## 1. Resource Design

### Customers
**Purpose:** Represents an end user who can place food delivery orders.
| Field | Type | Required/Optional | Description |
|---|---|---|---|
| `id` | UUID (v4) | Required (Generated) | Unique nonsequential identifier |
| `firstName` | String | Required | Customer's first name |
| `lastName` | String | Required | Customer's last name |
| `email` | String | Required | Customer's email address (unique) |
| `phone` | String | Optional | Customer's phone number |
| `createdAt` | DateTime | Required (Generated) | Timestamp of creation |
| `updatedAt` | DateTime | Required (Generated) | Timestamp of last update |

**Relationships:**
- Has many `Orders` (1:N)

### Restaurants
**Purpose:** Represents a business that prepares food and offers menu items.
| Field | Type | Required/Optional | Description |
|---|---|---|---|
| `id` | UUID (v4) | Required (Generated) | Unique nonsequential identifier |
| `name` | String | Required | Name of the restaurant |
| `description` | String | Optional | Brief description of the restaurant |
| `address` | String | Required | Physical location |
| `createdAt` | DateTime | Required (Generated) | Timestamp of creation |
| `updatedAt` | DateTime | Required (Generated) | Timestamp of last update |

**Relationships:**
- Has many `MenuItems` (1:N)
- Has many `Orders` (1:N)

### Menu Items
**Purpose:** Represents an individual food or drink item offered by a restaurant.
| Field | Type | Required/Optional | Description |
|---|---|---|---|
| `id` | UUID (v4) | Required (Generated) | Unique nonsequential identifier |
| `restaurantId` | UUID (v4) | Required | References the Restaurant |
| `name` | String | Required | Item name |
| `description` | String | Optional | Item description |
| `priceCents` | Integer | Required | Price in minor units (cents) |
| `currency` | String | Required | Explicit currency (e.g., 'USD', 'EUR') |
| `isAvailable`| Boolean | Optional (Default: true)| If the item is currently orderable |
| `createdAt` | DateTime | Required (Generated) | Timestamp of creation |
| `updatedAt` | DateTime | Required (Generated) | Timestamp of last update |

**Relationships:**
- Belongs to one `Restaurant` (N:1)
- Has many `OrderItems` (1:N)

### Orders
**Purpose:** Represents a customer's request to purchase menu items from a single restaurant.
| Field | Type | Required/Optional | Description |
|---|---|---|---|
| `id` | UUID (v4) | Required (Generated) | Unique nonsequential identifier |
| `customerId` | UUID (v4) | Required | References the Customer |
| `restaurantId` | UUID (v4) | Required | References the Restaurant |
| `status` | String | Required (Default: 'pending') | State of the order (`pending`, `accepted`, `preparing`, `out_for_delivery`, `delivered`, `cancelled`) |
| `totalPriceCents` | Integer | Required | Total price in minor units (cents) |
| `currency` | String | Required | Explicit currency |
| `createdAt` | DateTime | Required (Generated) | Timestamp of creation |
| `updatedAt` | DateTime | Required (Generated) | Timestamp of last update |

**Relationships:**
- Belongs to one `Customer` (N:1)
- Belongs to one `Restaurant` (N:1)
- Has many `OrderItems` (1:N)

### Order Items
**Purpose:** Represents a specific menu item and its quantity within a given order. Includes a price snapshot to ensure historical orders remain accurate when menu prices change.
| Field | Type | Required/Optional | Description |
|---|---|---|---|
| `id` | UUID (v4) | Required (Generated) | Unique nonsequential identifier |
| `orderId` | UUID (v4) | Required | References the Order |
| `menuItemId` | UUID (v4) | Required | References the Menu Item |
| `quantity` | Integer | Required | Number of this item ordered |
| `priceAtOrderCents`| Integer | Required | Price snapshot of a single item at time of order |
| `currency` | String | Required | Explicit currency |
| `createdAt` | DateTime | Required (Generated) | Timestamp of creation |
| `updatedAt` | DateTime | Required (Generated) | Timestamp of last update |

**Relationships:**
- Belongs to one `Order` (N:1)
- Belongs to one `MenuItem` (N:1)

### Relationship Diagram

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : "places"
    RESTAURANT ||--o{ MENU_ITEM : "offers"
    RESTAURANT ||--o{ ORDER : "receives"
    ORDER ||--|{ ORDER_ITEM : "contains"
    MENU_ITEM ||--o{ ORDER_ITEM : "ordered as"

    CUSTOMER {
        UUID id PK
        String firstName
        String lastName
        String email
    }
    RESTAURANT {
        UUID id PK
        String name
        String address
    }
    MENU_ITEM {
        UUID id PK
        UUID restaurantId FK
        String name
        Integer priceCents
    }
    ORDER {
        UUID id PK
        UUID customerId FK
        UUID restaurantId FK
        String status
        Integer totalPriceCents
    }
    ORDER_ITEM {
        UUID id PK
        UUID orderId FK
        UUID menuItemId FK
        Integer quantity
        Integer priceAtOrderCents
    }
```

## 2. Design Decisions

### Why these resources and relationships
The problem domain describes a food-delivery market. We need **Restaurants** offering food, which translates directly to **Menu Items**. We need **Customers** to act as users of the system. **Orders** bridge the gap, linking a Customer to a Restaurant. Since an order can consist of multiple distinct menu items in varying quantities, the **Order Item** join table is required. It allows orders to contain multiple items, each explicitly mapping to a menu item from the restaurant.

### Why generated identifiers (UUID v4)
Using UUIDs instead of sequential integers (like auto-incrementing IDs) for primary keys prevents identifier enumeration (e.g., users cannot guess how many orders or customers exist by looking at `id: 50`). They also make distributed system integration and database merging easier, as collisions are statistically negligible.

### Pagination (Offset-Based)
This API implements **Offset Pagination** (`limit` and `offset`) with server-side defensive validation.
- **Why Offset Pagination Was Chosen:** Offset pagination trivially supports dynamic multi-column sorting (e.g., sorting by `name`, `createdAt`, or `priceCents`) without requiring complex synthetic multi-column cursor indexes. It also makes calculating UI pagination metadata simple (total count, page numbers, `hasNextPage`).
- **Defensive Upper Clamping:** To prevent client-triggered Out-Of-Memory (OOM) crashes and excessive database load, requests specifying `limit > 100` are automatically clamped to `100`.
- **Invalid Pagination Values:** Both negative `limit` and negative `offset` are rejected with `400 Bad Request` and the error code `INVALID_PAGINATION`. This ensures clients receive an explicit signal rather than a silent empty result.

### Response Envelope
The API enforces a uniform response envelope for both success and errors across all endpoints.

**Success Envelope:**
```json
{
  "data": { ... or [...] },
  "meta": {
    "totalCount": 200,
    "limit": 20,
    "offset": 0,
    "hasNextPage": true
  }
}
```
*(Note: `meta` is omitted for single-resource lookups where pagination does not apply).*

**Error Envelope:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid pagination parameters."
  }
}
```
**Rationale:** A predictable contract eliminates ad-hoc client parsing logic. Clients can universally check for the presence of the top-level `error` object or unpack `data` safely.

---

## 3. Endpoints Documentation

**Base URLs:**
- **Production (Live Deployed):** `https://food-delivery-api-1-7iip.onrender.com/api/v1`
- **Local Development:** `http://localhost:3000/api/v1`

### Rate Limiting
- **Quota:** 100 requests per minute per IP.
- **Headers Returned:** `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.
- **On Exceeded:** Returns HTTP `429 Too Many Requests` with a `Retry-After` header and error envelope:
```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "You have exceeded the rate limit. Please try again later."
  }
}
```

---

### Endpoints Reference

#### 1. Restaurants

##### `GET /restaurants`
List all restaurants with optional filtering, sorting, and pagination.

- **Query Parameters:**
  - `limit` (integer, default `20`, max `100`, must be ≥ 0): Number of records to return. Values above `100` are clamped to `100`; negative values return `400`.
  - `offset` (integer, default `0`, must be ≥ 0): Number of records to skip. Negative values return `400`.
  - `name` (string, optional): Case-sensitive substring match on restaurant name.
  - `address` (string, optional): Substring match on address.
  - `sort` (string, optional, default `'createdAt'`): Field to sort by (`name`, `createdAt`).
  - `order` (string, optional, default `'desc'`): Sort direction (`asc`, `desc`).

- **Example Request:**
```bash
curl -s "https://food-delivery-api-1-7iip.onrender.com/api/v1/restaurants?limit=2&offset=0&sort=name&order=asc"
```

- **Example Response (200 OK):**
```json
{
  "data": [
    {
      "id": "3b29c9b4-023a-4da5-b1a7-19ff21295db2",
      "name": "Abshire and Sons Restaurant",
      "description": "Voluptatem solvo cubitum creber.",
      "address": "76492 Hills Summit",
      "createdAt": "2026-10-09T23:20:56.684Z",
      "updatedAt": "2026-10-09T23:20:56.684Z"
    },
    {
      "id": "c1387d3a-dfcf-4008-8e6c-7e617945d8b2",
      "name": "Altenwerth - O'Kon Restaurant",
      "description": "Comitatus voluptatibus vulariter.",
      "address": "40203 O'Keefe Locks",
      "createdAt": "2026-10-09T23:20:56.684Z",
      "updatedAt": "2026-10-09T23:20:56.684Z"
    }
  ],
  "meta": {
    "totalCount": 200,
    "limit": 2,
    "offset": 0,
    "hasNextPage": true
  }
}
```

---

##### `GET /restaurants/:id`
Retrieve a single restaurant by its UUID.

- **Example Request:**
```bash
curl -s "https://food-delivery-api-1-7iip.onrender.com/api/v1/restaurants/00c63eee-9845-451d-ab8f-876459d26e1a"
```

- **Example Response (200 OK):**
```json
{
  "data": {
    "id": "00c63eee-9845-451d-ab8f-876459d26e1a",
    "name": "Boyer Group Restaurant",
    "description": "Calamitas demum acquiro defluo terga.",
    "address": "5281 Dwayne Flats",
    "createdAt": "2026-10-09T23:20:56.684Z",
    "updatedAt": "2026-10-09T23:20:56.684Z"
  }
}
```

---

##### `GET /restaurants/:id/menu-items`
Retrieve paginated menu items belonging to a specific restaurant.

- **Query Parameters:**
  - `limit` (integer, default `20`, max `100`)
  - `offset` (integer, default `0`, min `0`)
  - `isAvailable` (boolean, optional): Filter by availability (`true` or `false`).
  - `sort` (string, optional, default `'name'`): Field to sort by (`name`, `priceCents`).
  - `order` (string, optional, default `'asc'`): Direction (`asc`, `desc`).

- **Example Request:**
```bash
curl -s "https://food-delivery-api-1-7iip.onrender.com/api/v1/restaurants/00c63eee-9845-451d-ab8f-876459d26e1a/menu-items?limit=2"
```

---

#### 2. Menu Items

##### `GET /menu-items`
List menu items across all restaurants.

- **Query Parameters:**
  - `limit`, `offset`, `name`, `isAvailable`, `sort` (`name`, `priceCents`), `order` (`asc`, `desc`).

- **Example Request:**
```bash
curl -s "https://food-delivery-api-1-7iip.onrender.com/api/v1/menu-items?limit=2"
```

##### `GET /menu-items/:id`
Get a specific menu item by UUID.

---

#### 3. Customers

##### `GET /customers`
List customers with optional filters.

- **Query Parameters:**
  - `limit`, `offset`, `firstName`, `email`, `sort` (`firstName`, `createdAt`), `order` (`asc`, `desc`).

- **Example Request:**
```bash
curl -s "https://food-delivery-api-1-7iip.onrender.com/api/v1/customers?limit=2"
```

##### `GET /customers/:id`
Get a specific customer by UUID.

---

#### 4. Orders

##### `GET /orders`
List orders with nested items, filtered by customer or status.

- **Query Parameters:**
  - `limit`, `offset`, `status`, `customerId`, `sort` (`createdAt`, `totalPriceCents`), `order` (`asc`, `desc`).

- **Example Request:**
```bash
curl -s "https://food-delivery-api-1-7iip.onrender.com/api/v1/orders?limit=2"
```

---

##### `GET /orders/:id`
Get a specific order including its ordered line items.

- **Example Request:**
```bash
curl -s "https://food-delivery-api-1-7iip.onrender.com/api/v1/orders/81c8a0bd-70b3-43dc-8f1a-9d7713f76831"
```

---

##### `POST /orders`
Create a new order with line items. Runs atomically inside a database transaction, snapshots item prices at the time of order creation, and computes the verified order total.

- **Request Body (JSON):**
```json
{
  "customerId": "00f90ff7-4489-4eed-a8e4-90216c4f026f",
  "restaurantId": "00c63eee-9845-451d-ab8f-876459d26e1a",
  "items": [
    {
      "menuItemId": "d17f19e8-d8f3-400a-9d52-2a5f8ba757c8",
      "quantity": 2
    }
  ]
}
```

- **Example Request:**
```bash
curl -s -X POST "https://food-delivery-api-1-7iip.onrender.com/api/v1/orders" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"00f90ff7-4489-4eed-a8e4-90216c4f026f","restaurantId":"00c63eee-9845-451d-ab8f-876459d26e1a","items":[{"menuItemId":"d17f19e8-d8f3-400a-9d52-2a5f8ba757c8","quantity":2}]}'
```

- **Example Response (201 Created):**
```json
{
  "data": {
    "id": "81c8a0bd-70b3-43dc-8f1a-9d7713f76831",
    "customerId": "00f90ff7-4489-4eed-a8e4-90216c4f026f",
    "restaurantId": "00c63eee-9845-451d-ab8f-876459d26e1a",
    "status": "pending",
    "totalPriceCents": 7128,
    "currency": "USD",
    "createdAt": "2026-10-09T23:46:18.641Z",
    "updatedAt": "2026-10-09T23:46:18.641Z",
    "orderItems": [
      {
        "id": "ffee089e-a30c-4881-b8b6-f046a3704f8b",
        "orderId": "81c8a0bd-70b3-43dc-8f1a-9d7713f76831",
        "menuItemId": "d17f19e8-d8f3-400a-9d52-2a5f8ba757c8",
        "quantity": 2,
        "priceAtOrderCents": 3564,
        "currency": "USD",
        "createdAt": "2026-10-09T23:46:18.641Z",
        "updatedAt": "2026-10-09T23:46:18.641Z"
      }
    ]
  }
}
```

---

##### `PATCH /orders/:id`
Partially update an order status (`pending`, `accepted`, `preparing`, `out_for_delivery`, `delivered`, `cancelled`).

- **Example Request:**
```bash
curl -s -X PATCH "https://food-delivery-api-1-7iip.onrender.com/api/v1/orders/81c8a0bd-70b3-43dc-8f1a-9d7713f76831" \
  -H "Content-Type: application/json" \
  -d '{"status":"accepted"}'
```

---

##### `DELETE /orders/:id`
Cancel and delete an order. **Guarded:** Only orders in `pending` status can be deleted; any attempt to delete non-pending orders is rejected with `422 Unprocessable Entity`.

- **Example Request:**
```bash
curl -s -X DELETE "https://food-delivery-api-1-7iip.onrender.com/api/v1/orders/81c8a0bd-70b3-43dc-8f1a-9d7713f76831"
```

- **Non-Pending Error Response (422 Unprocessable Entity):**
```json
{
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "message": "Only pending orders can be deleted"
  }
}
```

---

## 4. Local Setup & Development

### Prerequisites
- Node.js 18+
- PostgreSQL or SQLite

### Installation
1. Clone the repository and install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
PORT=3000
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_URL="postgresql://user:password@host:5432/dbname"
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

3. Initialize schema and database migrations:
```bash
npx prisma db push
```

4. Seed the database with realistic data (300 customers, 200 restaurants, ~2000 menu items, 500 orders):
```bash
npm run seed
```

5. Start the development server:
```bash
npm start
```

### Running Automated Verification
Run the verification test suite to validate pagination bounds, input filtering, order lifecycles, duplicate item rejection, and rate limiting.

By default the script targets the **local development server** (`http://localhost:3000/api/v1`), so you must start the server first:
```bash
npm start
```

Then in a separate terminal:
```bash
node verify.js
```

To run against the live deployed API (required opt-in — mutations and rate-limit tests will run against real data):
```bash
VERIFY_URL=https://food-delivery-api-1-7iip.onrender.com/api/v1 ALLOW_REMOTE=true node verify.js
```

To test read-only checks against the live API without mutation side-effects:
```bash
VERIFY_URL=https://food-delivery-api-1-7iip.onrender.com/api/v1 node verify.js
```
Mutation and rate-limit tests are skipped automatically when a remote URL is used without `ALLOW_REMOTE=true`.

---

## 5. Consumer Web Application
A modern, responsive web application is located at `consumer/index.html`. It demonstrates:
- Live fetching from the deployed REST API.
- Search filtering by restaurant name.
- Dynamic sorting by name or creation timestamp.
- Responsive pagination with page counts, bounds checking, and next/prev controls.
- Interactive viewing of restaurant menu items.
- Elegant loading, empty, and error feedback states.

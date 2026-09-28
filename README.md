# Food Delivery REST API

Production-ready, versioned REST API for food delivery with cursor pagination, dynamic filtering, sorting, rate limiting, and relational schema.

---

## 1. Domain Model & Resource Design

All identifiers are non-sequential, collision-resistant string IDs generated with entity-specific prefixes (e.g. `rest_...`, `menu_...`, `cust_...`, `ord_...`).

### Resource Specifications

#### 1. `Restaurant`
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Yes (Generated) | Prefixed identifier (`rest_*`) |
| `name` | String | Yes | Restaurant name |
| `cuisine` | String | Yes | Cuisine type (e.g., Italian, Japanese, Mexican) |
| `address` | String | Yes | Street address |
| `city` | String | Yes | City |
| `rating` | Float | Yes | Average rating (1.0 to 5.0) |
| `isOpen` | Boolean | Yes | Accepting orders toggle (default: `true`) |
| `createdAt` | DateTime | Yes (Generated) | Creation timestamp |
| `updatedAt` | DateTime | Yes (Generated) | Last update timestamp |

#### 2. `MenuItem` (References `Restaurant`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Yes (Generated) | Prefixed identifier (`menu_*`) |
| `restaurantId` | String | Yes (Foreign Key) | References `Restaurant.id` |
| `name` | String | Yes | Dish / item title |
| `description` | String | Yes | Item description |
| `category` | String | Yes | Category (`Appetizers`, `Mains`, `Sides`, `Desserts`, `Beverages`) |
| `priceInCents` | Integer | Yes | Price in smallest currency unit (e.g., 1450 = $14.50) |
| `isAvailable` | Boolean | Yes | Availability toggle (default: `true`) |
| `createdAt` | DateTime | Yes (Generated) | Creation timestamp |
| `updatedAt` | DateTime | Yes (Generated) | Last update timestamp |

#### 3. `Customer`
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Yes (Generated) | Prefixed identifier (`cust_*`) |
| `name` | String | Yes | Customer name |
| `email` | String | Yes (Unique) | Customer email address |
| `phone` | String | Yes | Phone number |
| `deliveryAddress` | String | Yes | Primary delivery address |
| `createdAt` | DateTime | Yes (Generated) | Creation timestamp |
| `updatedAt` | DateTime | Yes (Generated) | Last update timestamp |

#### 4. `Order` (References `Customer`, `Restaurant`, `MenuItem`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Yes (Generated) | Prefixed identifier (`ord_*`) |
| `customerId` | String | Yes (Foreign Key) | References `Customer.id` |
| `restaurantId` | String | Yes (Foreign Key) | References `Restaurant.id` |
| `status` | String | Yes | Status (`PENDING`, `CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`) |
| `totalAmountInCents` | Integer | Yes | Total order cost in cents |
| `deliveryAddress` | String | Yes | Delivery location for this order |
| `notes` | String | No | Optional instructions |
| `items` | Array | Yes | Relational items (`OrderItem`) linking `menuItemId`, `quantity`, `unitPriceInCents` |
| `createdAt` | DateTime | Yes (Generated) | Creation timestamp |
| `updatedAt` | DateTime | Yes (Generated) | Last update timestamp |

---

## 2. One-Page Relational Architecture

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

## 3. Database Seeding & Repeatability

The seed script (`prisma/seed.ts`) generates **2,100 records** across 4 resources:
- 200 Restaurants
- 1,000 Menu Items
- 300 Customers
- 600 Orders with 1,195 Order Items

To verify repeatability and idempotency:
```bash
npm run db:seed
npm run verify:seed
```
Running the seed multiple times produces identical record counts with zero duplicate errors.

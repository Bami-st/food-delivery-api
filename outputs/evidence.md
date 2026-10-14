# API Verification Evidence

> **Target:** `http://localhost:3001/api/v1`

### Paginated Response

```bash
$ curl -i -s -g "http://localhost:3001/api/v1/restaurants?limit=2&offset=0"
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 50;w=60
RateLimit-Limit: 50
RateLimit-Remaining: 32
RateLimit-Reset: 40
Content-Type: application/json; charset=utf-8
Content-Length: 301
ETag: W/"12d-XlfmKxGN08ISsQWOJulSanpLEL4"
Date: Wed, 14 Oct 2026 21:24:10 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"data":[{"id":"42b92309-21a7-4fcc-9a99-faad0d5cb68c","name":"Test Restaurant","description":"For isolated integration testing","address":"123 Test Street","createdAt":"2026-10-14T21:23:46.108Z","updatedAt":"2026-10-14T21:23:46.108Z"}],"meta":{"totalCount":1,"limit":2,"offset":0,"hasNextPage":false}}
```

### Maximum Limit Clamping (limit>100 clamped to 100)

```bash
$ curl -i -s -g "http://localhost:3001/api/v1/restaurants?limit=5000"
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 50;w=60
RateLimit-Limit: 50
RateLimit-Remaining: 31
RateLimit-Reset: 39
Content-Type: application/json; charset=utf-8
Content-Length: 303
ETag: W/"12f-75oVI5VYqfcncA/rf0QE7nRuKZM"
Date: Wed, 14 Oct 2026 21:24:11 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"data":[{"id":"42b92309-21a7-4fcc-9a99-faad0d5cb68c","name":"Test Restaurant","description":"For isolated integration testing","address":"123 Test Street","createdAt":"2026-10-14T21:23:46.108Z","updatedAt":"2026-10-14T21:23:46.108Z"}],"meta":{"totalCount":1,"limit":100,"offset":0,"hasNextPage":false}}
```

### Negative Limit Rejection (400 Bad Request)

```bash
$ curl -i -s -g "http://localhost:3001/api/v1/restaurants?limit=-1"
HTTP/1.1 400 Bad Request
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 50;w=60
RateLimit-Limit: 50
RateLimit-Remaining: 30
RateLimit-Reset: 37
Content-Type: application/json; charset=utf-8
Content-Length: 76
ETag: W/"4c-NEIJJchTA36m25VoTD6kFKrh088"
Date: Wed, 14 Oct 2026 21:24:11 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"INVALID_PAGINATION","message":"Limit cannot be negative"}}
```

### Invalid Offset Rejection (400 Bad Request)

```bash
$ curl -i -s -g "http://localhost:3001/api/v1/restaurants?offset=-5"
HTTP/1.1 400 Bad Request
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 50;w=60
RateLimit-Limit: 50
RateLimit-Remaining: 29
RateLimit-Reset: 37
Content-Type: application/json; charset=utf-8
Content-Length: 77
ETag: W/"4d-wP22bpL2e5LgezNuQnVWel05g5s"
Date: Wed, 14 Oct 2026 21:24:12 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"INVALID_PAGINATION","message":"Offset cannot be negative"}}
```

### Invalid Sort Field

```bash
$ curl -i -s -g "http://localhost:3001/api/v1/restaurants?sort=unknown"
HTTP/1.1 400 Bad Request
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 50;w=60
RateLimit-Limit: 50
RateLimit-Remaining: 28
RateLimit-Reset: 37
Content-Type: application/json; charset=utf-8
Content-Length: 91
ETag: W/"5b-vsQ5sQ/Fd/9q9K2Tksz1wkX3Ivk"
Date: Wed, 14 Oct 2026 21:24:12 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"VALIDATION_ERROR","message":"\"sort\" must be one of [name, createdAt]"}}
```

### Empty Order Rejection (422)

```bash
$ curl -i -s -X POST -H "Content-Type: application/json" -d @payload.json "http://localhost:3001/api/v1/orders"
HTTP/1.1 422 Unprocessable Entity
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 50;w=60
RateLimit-Limit: 50
RateLimit-Remaining: 24
RateLimit-Reset: 32
Content-Type: application/json; charset=utf-8
Content-Length: 93
ETag: W/"5d-NRF5sk6N4MbxiTzN6M6p9mGsizk"
Date: Wed, 14 Oct 2026 21:24:17 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"UNPROCESSABLE_ENTITY","message":"\"items\" must contain at least 1 items"}}
```

### Duplicate menuItemId Rejection (422)

```bash
$ curl -i -s -X POST -H "Content-Type: application/json" -d @payload.json "http://localhost:3001/api/v1/orders"
HTTP/1.1 422 Unprocessable Entity
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 50;w=60
RateLimit-Limit: 50
RateLimit-Remaining: 23
RateLimit-Reset: 32
Content-Type: application/json; charset=utf-8
Content-Length: 140
ETag: W/"8c-rHi61Fys6V0zkus/beDVDF3O28o"
Date: Wed, 14 Oct 2026 21:24:19 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"DUPLICATE_ITEM","message":"Duplicate menuItemId entries are not allowed. Each menu item may only appear once per order."}}
```

### Valid Order Creation (201)

```bash
$ curl -i -s -X POST -H "Content-Type: application/json" -d @payload.json "http://localhost:3001/api/v1/orders"
HTTP/1.1 201 Created
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 50;w=60
RateLimit-Limit: 50
RateLimit-Remaining: 22
RateLimit-Reset: 30
Content-Type: application/json; charset=utf-8
Content-Length: 591
ETag: W/"24f-RjjYdvpRbLJQGKMMWKhexgi797s"
Date: Wed, 14 Oct 2026 21:24:25 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"data":{"id":"5c533880-f166-4b36-8181-544b41790c1d","customerId":"c171f019-c2b2-4588-a235-a0e692e840ff","restaurantId":"42b92309-21a7-4fcc-9a99-faad0d5cb68c","status":"pending","totalPriceCents":1998,"currency":"USD","createdAt":"2026-10-14T21:24:22.986Z","updatedAt":"2026-10-14T21:24:22.986Z","orderItems":[{"id":"7bcb580a-432b-41fa-a7a6-d0d8b62ef6ed","orderId":"5c533880-f166-4b36-8181-544b41790c1d","menuItemId":"6ac31f25-b5f3-4ddb-a65a-f8db520baa04","quantity":2,"priceAtOrderCents":999,"currency":"USD","createdAt":"2026-10-14T21:24:22.986Z","updatedAt":"2026-10-14T21:24:22.986Z"}]}}
```

### Order Partial Update (Status)

```bash
$ curl -i -s -X PATCH -H "Content-Type: application/json" -d @payload.json "http://localhost:3001/api/v1/orders/5c533880-f166-4b36-8181-544b41790c1d"
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 50;w=60
RateLimit-Limit: 50
RateLimit-Remaining: 21
RateLimit-Reset: 24
Content-Type: application/json; charset=utf-8
Content-Length: 592
ETag: W/"250-0u14QDHq7Z4UglcxmaoaFX9JaxU"
Date: Wed, 14 Oct 2026 21:24:27 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"data":{"id":"5c533880-f166-4b36-8181-544b41790c1d","customerId":"c171f019-c2b2-4588-a235-a0e692e840ff","restaurantId":"42b92309-21a7-4fcc-9a99-faad0d5cb68c","status":"accepted","totalPriceCents":1998,"currency":"USD","createdAt":"2026-10-14T21:24:22.986Z","updatedAt":"2026-10-14T21:24:26.268Z","orderItems":[{"id":"7bcb580a-432b-41fa-a7a6-d0d8b62ef6ed","orderId":"5c533880-f166-4b36-8181-544b41790c1d","menuItemId":"6ac31f25-b5f3-4ddb-a65a-f8db520baa04","quantity":2,"priceAtOrderCents":999,"currency":"USD","createdAt":"2026-10-14T21:24:22.986Z","updatedAt":"2026-10-14T21:24:22.986Z"}]}}
```

### Order Deletion Rejection (Not Pending)

```bash
$ curl -i -s -X DELETE "http://localhost:3001/api/v1/orders/5c533880-f166-4b36-8181-544b41790c1d"
HTTP/1.1 422 Unprocessable Entity
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 50;w=60
RateLimit-Limit: 50
RateLimit-Remaining: 20
RateLimit-Reset: 22
Content-Type: application/json; charset=utf-8
Content-Length: 88
ETag: W/"58-H98mmARpmmiAGpM0tKGLYrXQVwQ"
Date: Wed, 14 Oct 2026 21:24:28 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"UNPROCESSABLE_ENTITY","message":"Only pending orders can be deleted"}}
```

### Valid Multi-Item Order (201)

```bash
$ curl -i -s -X POST -H "Content-Type: application/json" -d @payload.json "http://localhost:3001/api/v1/orders"
HTTP/1.1 201 Created
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 50;w=60
RateLimit-Limit: 50
RateLimit-Remaining: 19
RateLimit-Reset: 21
Content-Type: application/json; charset=utf-8
Content-Length: 870
ETag: W/"366-dftFKH+hj0SQ+pxe2icTdvdYDU0"
Date: Wed, 14 Oct 2026 21:24:33 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"data":{"id":"8d5c81e4-df74-433d-b89b-2cee8aabfa60","customerId":"c171f019-c2b2-4588-a235-a0e692e840ff","restaurantId":"42b92309-21a7-4fcc-9a99-faad0d5cb68c","status":"pending","totalPriceCents":1498,"currency":"USD","createdAt":"2026-10-14T21:24:31.898Z","updatedAt":"2026-10-14T21:24:31.898Z","orderItems":[{"id":"57f0836b-0d3b-432e-9610-552a86e6697e","orderId":"8d5c81e4-df74-433d-b89b-2cee8aabfa60","menuItemId":"6ac31f25-b5f3-4ddb-a65a-f8db520baa04","quantity":1,"priceAtOrderCents":999,"currency":"USD","createdAt":"2026-10-14T21:24:31.898Z","updatedAt":"2026-10-14T21:24:31.898Z"},{"id":"2e967903-935f-4d23-914f-3f463d76dbc4","orderId":"8d5c81e4-df74-433d-b89b-2cee8aabfa60","menuItemId":"9f5e6984-3f5c-4135-b78f-62154011e8d3","quantity":1,"priceAtOrderCents":499,"currency":"USD","createdAt":"2026-10-14T21:24:31.898Z","updatedAt":"2026-10-14T21:24:31.898Z"}]}}
```

### Rate Limit Rejection and Retry-After

```bash
$ curl -i "http://localhost:3001/api/v1/restaurants"
HTTP/1.1 429 Too Many Requests
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 50;w=60
RateLimit-Limit: 50
RateLimit-Remaining: 0
RateLimit-Reset: 12
Retry-After: 12
Content-Type: application/json; charset=utf-8
Content-Length: 108
ETag: W/"6c-AYQKN3ojNQzf+QPmRJvTztZ5p/M"
Date: Wed, 14 Oct 2026 21:25:38 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"TOO_MANY_REQUESTS","message":"You have exceeded the rate limit. Please try again later."}}
```


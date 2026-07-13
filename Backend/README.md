# Driprr Backend — Intern Assessment

A NestJS + Prisma + PostgreSQL REST API covering all three parts of the Driprr backend intern assessment.

---

## Quick Start

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

The server starts on **http://localhost:3000**.

> **Database**: Update `DATABASE_URL` in `.env` to point at your PostgreSQL instance before running migrations.  
> Default: `postgresql://postgres:postgres@localhost:5432/driprr?schema=public`

---

## Project Structure

```
src/
├── prisma/          # PrismaService (global)
├── stores/          # Part 1 + Part 2 (store CRUD + list products)
│   └── dto/
├── products/        # Part 2 (sell endpoint)
│   └── dto/
└── orders/          # Part 3 (create order + update status)
    └── dto/
prisma/
├── schema.prisma    # Store, Product, Order models
└── seed.ts          # Sample data
postman/
└── Driprr.postman_collection.json
```

---

## API Reference

### Part 1 — Store CRUD

| Method | Endpoint        | Description        |
|--------|-----------------|--------------------|
| POST   | /stores         | Create a store     |
| GET    | /stores         | List all stores    |
| GET    | /stores/:id     | Get one store      |
| PATCH  | /stores/:id     | Update a store     |
| DELETE | /stores/:id     | Delete a store     |

**Create/Update body fields:**

| Field   | Type    | Required | Validation                          |
|---------|---------|----------|-------------------------------------|
| name    | string  | yes      | non-empty                           |
| address | string  | yes      | non-empty                           |
| phone   | string  | yes      | matches `/^\+?[\d\s\-(). ]{7,20}$/` |
| isOpen  | boolean | no       | defaults to `true`                  |

---

### Part 2 — Relationship & Stock Logic

| Method | Endpoint                 | Description                         |
|--------|--------------------------|-------------------------------------|
| GET    | /stores/:id/products     | List all products for a store       |
| POST   | /products/:id/sell       | Decrease stock, return updated product |

**Sell body:** `{ "quantity": number }` — must be ≥ 1.  
Returns **400** if quantity > current stock.

---

### Part 3 — Orders

| Method | Endpoint               | Description                          |
|--------|------------------------|--------------------------------------|
| POST   | /orders                | Create order (also decrements stock) |
| PATCH  | /orders/:id/status     | Update order status                  |

**Create order body:** `{ "productId": string, "quantity": number }`

**Update status body:** `{ "status": "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED" }`  
Any other value returns **400** with a descriptive error.

---

## Data Models

```prisma
Store    { id, name, address, phone, isOpen, createdAt }
Product  { id, name, price, stock, storeId, createdAt }
Order    { id, productId, quantity, status, createdAt }
```

`status` is an enum: `PENDING | CONFIRMED | DELIVERED | CANCELLED`

---

## Assumptions Made

1. **Phone validation** uses a liberal regex (`/^\+?[\d\s\-(). ]{7,20}$/`) to accept common international formats. In production this would use a library like `libphonenumber-js`.

2. **Selling stock and creating an order** both go through the same `ProductsService.sell()` method, ensuring consistent stock-decrease logic in both `POST /products/:id/sell` and `POST /orders`.

3. **Order status transitions** have no enforced sequence (e.g., PENDING → CONFIRMED). The instructions only require the four values to be validated — no state-machine rules.

4. **DELETE /stores/:id** will fail with a database constraint error if the store still has products. In production you'd either cascade-delete or return a 409 Conflict. Added as a known limitation.

5. **No authentication** is implemented — the instructions don't mention it.

6. **Concurrent requests** are not handled with database transactions/locking per the instructions ("you don't need to worry about handling simultaneous requests").

---

## What I'd Improve With More Time

- **Transactions**: Wrap `OrdersService.create()` in a Prisma transaction so the order record and stock decrement are atomic.
- **Pagination**: Add `page` / `limit` query params to list endpoints.
- **Swagger/OpenAPI**: Add `@nestjs/swagger` decorators for auto-generated docs.
- **Auth**: JWT-based authentication with guards.
- **Cascade rules**: Decide on store-delete behavior (cascade products or block).
- **Tests**: Unit tests for services and e2e tests for controllers.
- **Stricter phone validation**: Use `libphonenumber-js` for per-country validation.

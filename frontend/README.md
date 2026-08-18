# Booked — Frontend (React + Redux Toolkit)

Client for **Booked**, a bookstore-meets-library. Talks to the Flask API in `../backend`.

## Stack
- React 18 + Vite
- Redux Toolkit + React Redux (state)
- React Router v6
- Tailwind CSS
- Axios
- Jest + React Testing Library

## Setup

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to http://localhost:5000
```

Make sure the backend is running first (see `../backend/README.md`) and seeded with demo data.

## Testing

```bash
npm test
```

## Design

- **Palette:** ink navy (`#1B2430`), paper cream (`#FAF6EE`), brass (`#B8863B`), burgundy (`#6B2737`, used for the shop/purchase flow), forest green (`#2F5233`, used for the library/lending flow).
- **Type:** Fraunces (serif, display) + Inter (body).
- **Signature element:** book cards double as "library index cards," and order/lending statuses render as small stamped labels (`PENDING`, `APPROVED`, `RETURNED`) to reinforce the shop-vs-library, receipt-vs-due-card metaphor.

## Folder structure

```
frontend/
  src/
    app/store.js               # Redux store
    services/api.js             # axios instance with JWT interceptor
    features/
      auth/authSlice.js
      books/booksSlice.js
      cart/cartSlice.js
      orders/ordersSlice.js
    components/                  # Navbar, BookCard, route guards, filters
    pages/                        # Home, BookDetail, Login, Register, Cart, MyActivity
    pages/admin/                   # AdminDashboard, AdminBooks, AdminOrders, AdminLending
    __tests__/                      # Jest + RTL tests
```

## User flows implemented

- **Auth:** register/login, JWT stored client-side, `/api/auth/me` rehydrates the session.
- **Browse:** search by title/author/genre, filter by genre/price/section, sort by price or newest.
- **Shop cart vs. Library cart:** separate carts, separate checkout flows (`/api/orders/checkout` vs `/api/lending/checkout`).
- **Orders:** purchase orders go `pending → approved/rejected`; once approved, the user can pay (`/api/orders/:id/pay`).
- **Lending:** requests go `pending → approved/rejected`; once approved, the user can initiate a return, and admin confirms it.
- **Admin:** manage books (CRUD), approve/reject orders, approve/reject lending, confirm returns.

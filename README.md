# Booked — Backend

The Flask + PostgreSQL API powering **Booked**, a bookstore and lending library where users can buy books or borrow them like a physical library, with admin oversight for lending.

Live API: `https://book-store-29gn.onrender.com`
Interactive API docs (Swagger UI): `https://book-store-29gn.onrender.com/apidocs/`

> Note: the live backend runs on Render's free tier, which spins down after inactivity. The first request after idle time can take 30–60 seconds to respond while the instance wakes up.

---

## Tech Stack

- **Flask** (app factory pattern) with six blueprints: `auth`, `books`, `cart`, `orders`, `lending`, `admin`
- **PostgreSQL** via SQLAlchemy + Flask-Migrate (Alembic)
- **JWT authentication** via Flask-JWT-Extended, with role-based access control (`user` / `admin`)
- **Flasgger** for auto-generated Swagger/OpenAPI documentation
- **Google Books API** integration — books are imported on first cart interaction, keyed by their Google Books volume ID rather than an internal integer ID
- **Gunicorn** as the production WSGI server (Render deployment)

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py        # App factory: extensions, blueprints, error handlers
│   ├── extensions.py       # db, migrate, jwt, bcrypt, cors, swagger instances
│   ├── models.py            # User, Book, CartItem, PurchaseOrder, OrderItem, LendingRequest
│   ├── utils.py              # admin_required decorator, etc.
│   ├── routes/
│   │   ├── auth.py            # register, login, /me
│   │   ├── books.py            # list/search/CRUD books
│   │   ├── cart.py              # purchase & lending carts
│   │   ├── orders.py             # checkout, mock card payment, order history
│   │   ├── lending.py             # borrow checkout, return requests
│   │   └── admin.py                # dashboard summary, lending approval, book/user management
│   └── services/
│       └── google_books.py         # get_or_import_book() — fetches & caches Google Books volumes
├── migrations/                       # Alembic migration history
├── tests/                             # pytest suite
├── config.py                           # env-driven configuration
├── run.py                               # entrypoint: app = create_app()
└── requirements.txt
```

---

## Local Setup

```bash
# 1. Clone and enter the backend folder
git clone <repo-url>
cd book-store/backend

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy the example env file and fill in your own values
cp .env.example .env

# 5. Apply database migrations
flask db upgrade

# 6. Run the development server
flask run
```

The API will be available at `http://localhost:5000`, with Swagger docs at `http://localhost:5000/apidocs/`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `SECRET_KEY` | Flask session secret |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Secret used to sign JWTs |
| `FRONTEND_ORIGIN` | Allowed CORS origin for the frontend |
| `GOOGLE_BOOKS_API_KEY` | Google Books API key (server-side only — never expose this in frontend requests) |

---

## Authentication & Roles

- `POST /api/auth/register` and `POST /api/auth/login` return a JWT `access_token`.
- Include it on subsequent requests: `Authorization: Bearer <token>`.
- Users have a `role` of `user` or `admin`. Admin-only routes are protected with an `@admin_required` decorator and return `403` for non-admin users.
- To promote a user to admin, update their role directly in the database (there is no self-service promotion endpoint, by design):
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'someone@example.com';
  ```

---

## Core Workflows

### Buying a book
1. `POST /api/cart` with `{ "book_id": ..., "cart_type": "purchase" }`
2. `POST /api/orders/checkout` — converts the cart into an order, ready for payment immediately (no admin approval needed for purchases)
3. `POST /api/orders/<id>/pay/mock` with card details — simulates a card payment. A card number ending in `0000` simulates a decline; any other 16-digit number simulates success. **This is a mock endpoint for demo purposes — no real payment gateway is involved.**

### Borrowing a book
1. `POST /api/cart` with `{ "book_id": ..., "cart_type": "lending" }`
2. `POST /api/lending/checkout` — creates a pending `LendingRequest`
3. An admin approves it: `POST /api/admin/lending/<id>/approve` — sets a 14-day due date and decrements the book's `available_copies`
4. The user can later request a return: `POST /api/lending/<id>/return`
5. An admin confirms the physical return: `POST /api/admin/lending/<id>/confirm-return` — increments `available_copies` back

Unlike purchases, **lending requests always require admin approval**, since they manage a limited resource (`available_copies`), simulating how a physical library works.

---

## API Documentation

Full interactive API documentation, including all request/response schemas, is available via Swagger UI at `/apidocs/` once the server is running. The raw OpenAPI spec is available at `/apispec_1.json` and can be imported directly into Postman (**Import → Link**).

---

## Running Tests

```bash
pytest
```

---

## Deployment (Render)

The backend is deployed on [Render](https://render.com) as a Web Service:

- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt && flask db upgrade`
- **Start Command:** `gunicorn run:app`
- **Python version:** pinned via the `PYTHON_VERSION` environment variable (`3.12.7`) — Render's default Python version can outpace `psycopg2-binary`'s available wheels, causing an `ImportError` at startup if left unpinned.

A managed Render PostgreSQL instance provides `DATABASE_URL`.

---

## Known Limitations

- **Payment is simulated**, not real. `POST /orders/<id>/pay/mock` demonstrates the payment *workflow* (order states, success/decline branching) without integrating a live payment gateway.
- **Lending due dates are not enforced.** `LendingRequest.due_date` is tracked and displayed, but there is currently no automated process to flag a loan as overdue once the date passes.
- Earlier exploration of M-Pesa (via KCB's BUNI API) and card payments (via Flutterwave) exists in the git history but was not used in the final deployed version, in favor of the reliable mock endpoint above.
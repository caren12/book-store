# Booked — Backend (Flask API)

REST API for **Booked**, an online bookstore that doubles as a lending library.

## Stack
- Flask 3 + Flask-SQLAlchemy + Flask-Migrate
- PostgreSQL
- Flask-JWT-Extended (auth) + Flask-Bcrypt (password hashing)
- Pytest (minitests)

## Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit DATABASE_URL, SECRET_KEY, JWT_SECRET_KEY

# Create the Postgres DB first, e.g.:
#   createdb booked_db

flask db init                   # first time only
flask db migrate -m "initial tables"
flask db upgrade

python -m app.seed              # creates admin + demo user + sample books
python run.py                   # runs on http://localhost:5000
```

Demo logins after seeding:
- Admin: `admin@booked.com` / `admin123`
- User: `reader@booked.com` / `reader123`

## Running tests

```bash
pytest
```

Tests run against an in-memory SQLite DB, so no Postgres connection is required to test.

## API overview

| Area | Method & Path | Auth |
|---|---|---|
| Auth | `POST /api/auth/register` | public |
| Auth | `POST /api/auth/login` | public |
| Auth | `GET /api/auth/me` | user |
| Books | `GET /api/books?q=&genre=&section=&min_price=&max_price=&sort=` | public |
| Books | `GET /api/books/genres` | public |
| Books | `GET /api/books/<id>` | public |
| Books | `POST /api/books` | admin |
| Books | `PUT /api/books/<id>` | admin |
| Books | `DELETE /api/books/<id>` | admin |
| Cart | `GET /api/cart?cart_type=` | user |
| Cart | `POST /api/cart` `{book_id, cart_type, quantity}` | user |
| Cart | `DELETE /api/cart/<id>` | user |
| Orders | `POST /api/orders/checkout` | user |
| Orders | `GET /api/orders` | user |
| Orders | `POST /api/orders/<id>/pay` | user |
| Lending | `POST /api/lending/checkout` | user |
| Lending | `GET /api/lending` | user |
| Lending | `POST /api/lending/<id>/return` | user |
| Admin | `GET /api/admin/orders`, `POST .../approve`, `POST .../reject` | admin |
| Admin | `GET /api/admin/lending`, `POST .../approve`, `.../reject`, `.../confirm-return` | admin |
| Admin | `GET /api/admin/books`, `GET /api/admin/users` | admin |

## Folder structure

```
backend/
  app/
    __init__.py       # app factory
    extensions.py      # db, jwt, bcrypt, cors, migrate
    models.py           # User, Book, CartItem, PurchaseOrder, OrderItem, LendingRequest
    utils.py             # admin_required decorator
    seed.py               # demo data
    routes/
      auth.py
      books.py
      cart.py
      orders.py
      lending.py
      admin.py
  tests/
  config.py
  run.py
```

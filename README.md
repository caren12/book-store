# Booked — Backend

Flask API for Booked, an online bookstore and lending library. Handles auth, cart, checkout, lending, and admin management. Book data is sourced from the Google Books API and imported into the local database on first use.

## Tech Stack

- Flask
- PostgreSQL
- SQLAlchemy + Flask-Migrate (Alembic)
- Flask-JWT-Extended (authentication)
- Flask-CORS
- Bcrypt (password hashing)

## Getting Started

### Prerequisites

- Python 3.10+
- PostgreSQL installed and running

### 1. Set up the virtual environment

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Create the database and user

```bash
sudo -u postgres psql -c "CREATE USER booked_user WITH PASSWORD 'booked_pass';"
sudo -u postgres psql -c "CREATE DATABASE booked_db OWNER booked_user;"
```

### 3. Configure environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

`.env` should contain:

```
DATABASE_URL=postgresql://booked_user:booked_pass@localhost:5432/booked_db
JWT_SECRET_KEY=your_jwt_secret_here
SECRET_KEY=your_secret_key_here
FLASK_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
GOOGLE_BOOKS_API_KEY=your_google_books_api_key_here
```

Get a Google Books API key from the [Google Cloud Console](https://console.cloud.google.com/) — enable the **Books API**, then create and restrict an API key to that API only. `.env` is git-ignored; never commit it.

### 4. Run migrations

```bash
flask db upgrade
```

If `migrations/` doesn't exist yet in your clone for some reason:

```bash
flask db init
flask db migrate -m "initial migration"
flask db upgrade
```

### 5. Start the server

```bash
flask run
```

Runs on `http://localhost:5000` by default. The frontend's Vite dev server proxies `/api` requests here.

## Project Structure

```
backend/
├── app/
│   ├── models.py              # SQLAlchemy models (User, Book, CartItem, PurchaseOrder, OrderItem, LendingRequest)
│   ├── routes/
│   │   ├── auth.py            # register, login, me
│   │   ├── books.py           # book listing/search
│   │   ├── cart.py            # cart add/remove/list
│   │   ├── orders.py          # checkout, order history
│   │   ├── lending.py         # lending requests
│   │   └── admin.py           # admin book/order/lending/user management
│   ├── services/
│   │   └── google_books.py    # fetches + imports books from the Google Books API
│   └── extensions.py          # db, bcrypt, jwt, etc.
├── migrations/                 # Alembic migration history
├── tests/
├── config.py
├── run.py
├── requirements.txt
└── .env.example
```

## How Book Data Works

Books are **not** manually seeded. `Book.id` is a Google Books volume ID (string, e.g. `"d_wvEQAAQBAJ"`), not an auto-incrementing integer. The frontend fetches book search results live from the Google Books API. The first time a user adds a given book to their cart (or otherwise interacts with it in a way that needs a local record), the backend fetches that volume from Google Books and creates a matching row in the `books` table — see `get_or_import_book()` in `app/services/google_books.py`. Store price, library availability, and copy counts are derived deterministically from the book's ID (Google's API doesn't provide this data), so the same book always gets the same simulated price/availability.

## Auth

JWT-based. `POST /api/auth/register` and `POST /api/auth/login` return a `user` object and `access_token`. The frontend stores the token in `localStorage` and sends it as a `Bearer` token on subsequent requests. `GET /api/auth/me` returns the current user based on the token.

Roles: `user` (default) and `admin`, stored on `User.role`. Admin-only routes live under `/api/admin/*` and should be protected with a role check.

## Key Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/books` | List/search books |
| GET | `/api/cart` | Get current user's cart |
| POST | `/api/cart` | Add a book to cart (imports from Google Books if needed) |
| DELETE | `/api/cart/<item_id>` | Remove a cart item |
| POST | `/api/orders/checkout` | Convert purchase cart into an order |
| POST | `/api/lending/checkout` | Convert lending cart into lending requests |
| GET | `/api/admin/books` | Admin: list all books |
| GET | `/api/admin/orders` | Admin: list all orders |
| GET | `/api/admin/lending` | Admin: list all lending requests |

## Troubleshooting

- **500 on login/register**: usually means the database isn't reachable or migrations haven't been run — confirm PostgreSQL is running and `flask db upgrade` has been applied.
- **404 "Book not found" on cart/checkout**: `GOOGLE_BOOKS_API_KEY` is likely missing or not loaded — check `.env`, restart the server after editing it, and verify with `flask shell` → `import os; print(os.environ.get("GOOGLE_BOOKS_API_KEY"))`.
- **`invalid input syntax for type integer`**: leftover data or code expecting integer book IDs — make sure you're on the migration that changes `Book.id` to `String`.

## Security Notes

- Secrets live only in `.env`, which is git-ignored and has never been committed to this repo's history
- Rotate any API key immediately via the Google Cloud Console if it's ever exposed, and update `.env`
- Restrict API keys by application and API scope in the Cloud Console
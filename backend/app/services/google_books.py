"""Fetches book data from the Google Books API and imports it into our
own `books` table on first use, so cart/order/lending records always
have a real local Book row to reference (see routes/cart.py)."""

import os
import requests
from app.extensions import db
from app.models import Book

GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes"


def _hash_to_unit(value: str) -> float:
    """Deterministic pseudo-random float in [0, 1) from a string,
    matching the frontend's hashToUnit so mock pricing/availability
    stays consistent whether a book is imported from the backend or
    already computed client-side."""
    h = 0
    for ch in value:
        h = (h << 5) - h + ord(ch)
        h &= 0xFFFFFFFF
    if h >= 0x80000000:
        h -= 0x100000000
    return abs(h % 1000) / 1000


def fetch_google_book(volume_id: str) -> dict | None:
    """Fetches a single volume from the Google Books API by ID.
    Returns None if not found or the request fails."""
    api_key = os.environ.get("GOOGLE_BOOKS_API_KEY")
    url = f"{GOOGLE_BOOKS_API_URL}/{volume_id}"
    params = {"key": api_key} if api_key else {}

    try:
        res = requests.get(url, params=params, timeout=5)
    except requests.RequestException:
        return None

    if not res.ok:
        return None

    return res.json()


def search_google_books(query: str, max_results: int = 20) -> list[dict]:
    """Searches the Google Books API by free-text query. Returns the raw
    list of volume items (same shape the frontend used to get directly
    from Google), or an empty list on failure."""
    api_key = os.environ.get("GOOGLE_BOOKS_API_KEY")
    params = {"q": query, "maxResults": max_results}
    if api_key:
        params["key"] = api_key

    try:
        res = requests.get(GOOGLE_BOOKS_API_URL, params=params, timeout=8)
    except requests.RequestException:
        return []

    if not res.ok:
        return []

    return res.json().get("items", [])


def import_book_from_google(volume_id: str) -> Book | None:
    """Fetches a book from Google Books and creates a local Book row
    for it, mirroring the frontend's mapVolumeToBook logic so pricing
    and availability are computed the same way. Returns the existing
    Book if it's already in the database."""
    existing = Book.query.get(volume_id)
    if existing:
        return existing

    item = fetch_google_book(volume_id)
    if not item:
        return None

    info = item.get("volumeInfo", {})
    sale = item.get("saleInfo", {})
    rand = _hash_to_unit(volume_id)

    list_price = sale.get("listPrice", {}).get("amount")
    price = float(list_price) if list_price else round(9.99 + rand * 20, 2)

    is_in_library = rand < 0.55
    total_copies = int(rand * 5) + 1 if is_in_library else 0
    available_copies = 0 if rand < 0.15 else total_copies

    categories = info.get("categories") or []
    genre = categories[0].split("/")[0].split("&")[0].strip() if categories else "General"

    cover_url = (
        info.get("imageLinks", {}).get("thumbnail")
        or info.get("imageLinks", {}).get("smallThumbnail")
        or ""
    ).replace("http://", "https://")

    authors = info.get("authors") or ["Unknown Author"]

    book = Book(
        id=volume_id,
        title=info.get("title", "Untitled"),
        author=authors[0],
        genre=genre,
        description=info.get("description", ""),
        cover_url=cover_url,
        price=price,
        is_in_store=True,
        is_in_library=is_in_library,
        total_copies=total_copies,
        available_copies=available_copies,
    )
    db.session.add(book)
    db.session.commit()
    return book


def get_or_import_book(volume_id: str) -> Book | None:
    """Looks up a book locally first; if missing, imports it from
    Google Books. This is what route handlers should call instead of
    Book.query.get() directly whenever a book_id might come straight
    from a Google Books search result the user hasn't interacted
    with before."""
    book = Book.query.get(volume_id)
    if book:
        return book
    return import_book_from_google(volume_id)
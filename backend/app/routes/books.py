from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Book
from app.utils import admin_required

books_bp = Blueprint("books", __name__)


@books_bp.get("")
def list_books():
    """List/search/filter books.
    Query params: q (title/genre search), genre, min_price, max_price,
    section ('store' | 'library'), sort ('newest' | 'price_asc' | 'price_desc')
    """
    query = Book.query

    q = request.args.get("q")
    if q:
        like = f"%{q}%"
        query = query.filter(db.or_(Book.title.ilike(like), Book.genre.ilike(like), Book.author.ilike(like)))

    genre = request.args.get("genre")
    if genre:
        query = query.filter(Book.genre.ilike(genre))

    section = request.args.get("section")
    if section == "store":
        query = query.filter(Book.is_in_store.is_(True))
    elif section == "library":
        query = query.filter(Book.is_in_library.is_(True))

    min_price = request.args.get("min_price", type=float)
    if min_price is not None:
        query = query.filter(Book.price >= min_price)

    max_price = request.args.get("max_price", type=float)
    if max_price is not None:
        query = query.filter(Book.price <= max_price)

    sort = request.args.get("sort", "newest")
    if sort == "price_asc":
        query = query.order_by(Book.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Book.price.desc())
    else:
        query = query.order_by(Book.date_uploaded.desc())

    books = query.all()
    return jsonify({"books": [b.to_dict() for b in books]}), 200


@books_bp.get("/genres")
def list_genres():
    genres = [row[0] for row in db.session.query(Book.genre).distinct().all()]
    return jsonify({"genres": sorted(genres)}), 200


@books_bp.get("/<int:book_id>")
def get_book(book_id):
    book = Book.query.get(book_id)
    if not book:
        return jsonify({"error": "Book not found"}), 404
    return jsonify({"book": book.to_dict()}), 200


@books_bp.post("")
@admin_required
def create_book():
    data = request.get_json() or {}
    required = ["title", "author", "genre"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    book = Book(
        title=data["title"],
        author=data["author"],
        genre=data["genre"],
        description=data.get("description", ""),
        cover_url=data.get("cover_url", ""),
        price=data.get("price", 0),
        is_in_store=data.get("is_in_store", True),
        is_in_library=data.get("is_in_library", False),
        total_copies=data.get("total_copies", 1),
        available_copies=data.get("total_copies", 1),
    )
    db.session.add(book)
    db.session.commit()
    return jsonify({"book": book.to_dict()}), 201


@books_bp.put("/<int:book_id>")
@admin_required
def update_book(book_id):
    book = Book.query.get(book_id)
    if not book:
        return jsonify({"error": "Book not found"}), 404

    data = request.get_json() or {}
    for field in ["title", "author", "genre", "description", "cover_url", "price",
                  "is_in_store", "is_in_library", "total_copies", "available_copies"]:
        if field in data:
            setattr(book, field, data[field])

    db.session.commit()
    return jsonify({"book": book.to_dict()}), 200


@books_bp.delete("/<int:book_id>")
@admin_required
def delete_book(book_id):
    book = Book.query.get(book_id)
    if not book:
        return jsonify({"error": "Book not found"}), 404
    db.session.delete(book)
    db.session.commit()
    return jsonify({"message": "Book deleted"}), 200
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Book
from app.utils import admin_required

books_bp = Blueprint("books", __name__)


@books_bp.get("")
def list_books():
    """List/search/filter books
    ---
    tags:
      - Books
    parameters:
      - name: q
        in: query
        type: string
        required: false
        description: Search term matched against title, genre, and author
      - name: genre
        in: query
        type: string
        required: false
      - name: section
        in: query
        type: string
        enum: [store, library]
        required: false
      - name: min_price
        in: query
        type: number
        required: false
      - name: max_price
        in: query
        type: number
        required: false
      - name: sort
        in: query
        type: string
        enum: [newest, price_asc, price_desc]
        required: false
        default: newest
    responses:
      200:
        description: A list of books matching the given filters
        schema:
          type: object
          properties:
            books:
              type: array
              items:
                type: object
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
    """List all distinct genres
    ---
    tags:
      - Books
    responses:
      200:
        description: Sorted list of distinct genres in the catalog
        schema:
          type: object
          properties:
            genres:
              type: array
              items:
                type: string
    """
    genres = [row[0] for row in db.session.query(Book.genre).distinct().all()]
    return jsonify({"genres": sorted(genres)}), 200


@books_bp.get("/<int:book_id>")
def get_book(book_id):
    """Get a single book by ID
    ---
    tags:
      - Books
    parameters:
      - name: book_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: The requested book
        schema:
          type: object
          properties:
            book:
              type: object
      404:
        description: Book not found
    """
    book = Book.query.get(book_id)
    if not book:
        return jsonify({"error": "Book not found"}), 404
    return jsonify({"book": book.to_dict()}), 200


@books_bp.post("")
@admin_required
def create_book():
    """Create a new book (admin only)
    ---
    tags:
      - Books
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - title
            - author
            - genre
          properties:
            title:
              type: string
            author:
              type: string
            genre:
              type: string
            description:
              type: string
            cover_url:
              type: string
            price:
              type: number
            is_in_store:
              type: boolean
              default: true
            is_in_library:
              type: boolean
              default: false
            total_copies:
              type: integer
              default: 1
    responses:
      201:
        description: Book created
      400:
        description: Missing required fields
    """
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
    """Update an existing book (admin only)
    ---
    tags:
      - Books
    security:
      - Bearer: []
    parameters:
      - name: book_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            title:
              type: string
            author:
              type: string
            genre:
              type: string
            description:
              type: string
            cover_url:
              type: string
            price:
              type: number
            is_in_store:
              type: boolean
            is_in_library:
              type: boolean
            total_copies:
              type: integer
            available_copies:
              type: integer
    responses:
      200:
        description: Book updated
      404:
        description: Book not found
    """
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
    """Delete a book (admin only)
    ---
    tags:
      - Books
    security:
      - Bearer: []
    parameters:
      - name: book_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Book deleted
      404:
        description: Book not found
    """
    book = Book.query.get(book_id)
    if not book:
        return jsonify({"error": "Book not found"}), 404
    db.session.delete(book)
    db.session.commit()
    return jsonify({"message": "Book deleted"}), 200
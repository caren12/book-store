from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import CartItem, Book

cart_bp = Blueprint("cart", __name__)


@cart_bp.get("")
@jwt_required()
def get_cart():
    user_id = get_jwt_identity()
    cart_type = request.args.get("cart_type")  # optional filter: purchase | lending
    query = CartItem.query.filter_by(user_id=user_id)
    if cart_type:
        query = query.filter_by(cart_type=cart_type)
    items = query.all()
    return jsonify({"items": [i.to_dict() for i in items]}), 200


@cart_bp.post("")
@jwt_required()
def add_to_cart():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    book_id = data.get("book_id")
    cart_type = data.get("cart_type")  # "purchase" | "lending"
    quantity = data.get("quantity", 1)

    if cart_type not in ("purchase", "lending"):
        return jsonify({"error": "cart_type must be 'purchase' or 'lending'"}), 400

    book = Book.query.get(book_id)
    if not book:
        return jsonify({"error": "Book not found"}), 404
    if cart_type == "purchase" and not book.is_in_store:
        return jsonify({"error": "This book is not available for purchase"}), 400
    if cart_type == "lending" and not book.is_in_library:
        return jsonify({"error": "This book is not available in the library"}), 400

    existing = CartItem.query.filter_by(user_id=user_id, book_id=book_id, cart_type=cart_type).first()
    if existing:
        existing.quantity += quantity
    else:
        existing = CartItem(user_id=user_id, book_id=book_id, cart_type=cart_type, quantity=quantity)
        db.session.add(existing)

    db.session.commit()
    return jsonify({"item": existing.to_dict()}), 201


@cart_bp.delete("/<int:item_id>")
@jwt_required()
def remove_from_cart(item_id):
    user_id = get_jwt_identity()
    item = CartItem.query.filter_by(id=item_id, user_id=user_id).first()
    if not item:
        return jsonify({"error": "Cart item not found"}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item removed"}), 200

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import CartItem, PurchaseOrder, OrderItem

orders_bp = Blueprint("orders", __name__)


@orders_bp.post("/checkout")
@jwt_required()
def checkout():
    """Turns everything in the user's purchase cart into a pending order."""
    user_id = get_jwt_identity()
    cart_items = CartItem.query.filter_by(user_id=user_id, cart_type="purchase").all()

    if not cart_items:
        return jsonify({"error": "Your purchase cart is empty"}), 400

    total = sum(float(ci.book.price) * ci.quantity for ci in cart_items)
    order = PurchaseOrder(user_id=user_id, status="pending", payment_status="unpaid", total_amount=total)
    db.session.add(order)
    db.session.flush()

    for ci in cart_items:
        db.session.add(OrderItem(
            order_id=order.id,
            book_id=ci.book_id,
            quantity=ci.quantity,
            unit_price=ci.book.price,
        ))
        db.session.delete(ci)

    db.session.commit()
    return jsonify({"order": order.to_dict()}), 201


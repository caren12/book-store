import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import CartItem, PurchaseOrder, OrderItem

orders_bp = Blueprint("orders", __name__)


@orders_bp.post("/checkout")
@jwt_required()
def checkout():
    """Checkout the purchase cart into an order ready for payment
    ---
    tags:
      - Orders
    security:
      - Bearer: []
    description: >
      Turns everything in the user's purchase cart into a single PurchaseOrder,
      then clears the cart. Purchase orders no longer require admin approval —
      only lending requests do — so the order is created ready for immediate
      payment via /pay/mock.
    responses:
      201:
        description: Order created
        schema:
          type: object
          properties:
            order:
              type: object
      400:
        description: Purchase cart is empty
    """
    user_id = get_jwt_identity()
    cart_items = CartItem.query.filter_by(user_id=user_id, cart_type="purchase").all()

    if not cart_items:
        return jsonify({"error": "Your purchase cart is empty"}), 400

    total = sum(float(ci.book.price) * ci.quantity for ci in cart_items)
    order = PurchaseOrder(user_id=user_id, status="approved", payment_status="unpaid", total_amount=total)
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


@orders_bp.get("")
@jwt_required()
def list_my_orders():
    """List the current user's orders
    ---
    tags:
      - Orders
    security:
      - Bearer: []
    responses:
      200:
        description: Orders belonging to the authenticated user, newest first
        schema:
          type: object
          properties:
            orders:
              type: array
              items:
                type: object
    """
    user_id = get_jwt_identity()
    orders = PurchaseOrder.query.filter_by(user_id=user_id).order_by(PurchaseOrder.created_at.desc()).all()
    return jsonify({"orders": [o.to_dict() for o in orders]}), 200


@orders_bp.post("/<int:order_id>/pay/mock")
@jwt_required()
def pay_order_mock(order_id):
    """Simulate a card payment without calling any real payment provider
    ---
    tags:
      - Orders
    security:
      - Bearer: []
    description: >
      For demo/testing purposes only. Simulates a card charge synchronously —
      no external API call, no webhook, no ngrok tunnel required. Card details
      are never stored. Use card_number ending in "0000" to simulate a
      declined payment; any other 16-digit number simulates success.
    parameters:
      - name: order_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - card_number
            - expiry
            - cvv
          properties:
            card_number:
              type: string
              example: "4111111111111111"
              description: 16 digits. Ending in "0000" simulates a declined card.
            expiry:
              type: string
              example: "12/28"
            cvv:
              type: string
              example: "123"
    responses:
      200:
        description: Payment simulated (check payment_status for the outcome)
        schema:
          type: object
          properties:
            order:
              type: object
            message:
              type: string
      400:
        description: Order not yet approved, already paid, or invalid card details
      404:
        description: Order not found
    """
    user_id = get_jwt_identity()
    order = PurchaseOrder.query.filter_by(id=order_id, user_id=user_id).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order.status != "approved":
        return jsonify({"error": "Order must be approved before payment"}), 400
    if order.payment_status == "paid":
        return jsonify({"error": "Order already paid"}), 400

    data = request.get_json() or {}
    card_number = str(data.get("card_number", "")).replace(" ", "")
    expiry = data.get("expiry", "")
    cvv = str(data.get("cvv", ""))

    if not card_number.isdigit() or len(card_number) != 16:
        return jsonify({"error": "card_number must be 16 digits"}), 400
    if not expiry:
        return jsonify({"error": "expiry is required"}), 400
    if not cvv.isdigit() or len(cvv) not in (3, 4):
        return jsonify({"error": "cvv must be 3 or 4 digits"}), 400

    reference = f"MOCK-{order.id}-{uuid.uuid4().hex[:10]}"
    order.flw_reference = reference  # reused column name, harmless if unused elsewhere

    if card_number.endswith("0000"):
        order.payment_status = "failed"
        order.flw_status_detail = "Simulated decline: insufficient funds"
        db.session.commit()
        return jsonify({
            "order": order.to_dict(),
            "message": "Payment declined (simulated).",
        }), 200

    order.payment_status = "paid"
    order.flw_status_detail = "Simulated success"
    db.session.commit()

    return jsonify({
        "order": order.to_dict(),
        "message": "Payment successful (simulated).",
    }), 200
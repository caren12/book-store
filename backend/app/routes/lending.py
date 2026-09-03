from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import CartItem, LendingRequest

lending_bp = Blueprint("lending", __name__)


@lending_bp.post("/checkout")
@jwt_required()
def checkout_lending():
    """Checkout the lending cart into pending lending requests
    ---
    tags:
      - Lending
    security:
      - Bearer: []
    description: >
      Turns everything in the user's lending cart into pending LendingRequest
      records. Items for books with no available copies are silently skipped.
    responses:
      201:
        description: Lending requests created
        schema:
          type: object
          properties:
            lending_requests:
              type: array
              items:
                type: object
      400:
        description: Lending cart is empty
    """
    user_id = get_jwt_identity()
    cart_items = CartItem.query.filter_by(user_id=user_id, cart_type="lending").all()

    if not cart_items:
        return jsonify({"error": "Your lending cart is empty"}), 400

    created = []
    for ci in cart_items:
        if ci.book.available_copies < 1:
            continue
        req = LendingRequest(user_id=user_id, book_id=ci.book_id, status="pending")
        db.session.add(req)
        db.session.delete(ci)
        created.append(req)

    db.session.commit()
    return jsonify({"lending_requests": [r.to_dict() for r in created]}), 201


@lending_bp.get("")
@jwt_required()
def list_my_lending():
    """List the current user's lending requests
    ---
    tags:
      - Lending
    security:
      - Bearer: []
    responses:
      200:
        description: Lending requests belonging to the authenticated user, newest first
        schema:
          type: object
          properties:
            lending_requests:
              type: array
              items:
                type: object
    """
    user_id = get_jwt_identity()
    requests_ = LendingRequest.query.filter_by(user_id=user_id).order_by(LendingRequest.requested_at.desc()).all()
    return jsonify({"lending_requests": [r.to_dict() for r in requests_]}), 200


@lending_bp.post("/<int:request_id>/return")
@jwt_required()
def initiate_return(request_id):
    """Initiate the return of a borrowed book
    ---
    tags:
      - Lending
    security:
      - Bearer: []
    parameters:
      - name: request_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Return initiated, status set to return_requested
        schema:
          type: object
          properties:
            lending_request:
              type: object
      400:
        description: Only approved, currently-lent books can be returned
      404:
        description: Lending request not found
    """
    user_id = get_jwt_identity()
    req = LendingRequest.query.filter_by(id=request_id, user_id=user_id).first()
    if not req:
        return jsonify({"error": "Lending request not found"}), 404
    if req.status != "approved":
        return jsonify({"error": "Only approved, currently-lent books can be returned"}), 400

    req.status = "return_requested"
    db.session.commit()
    return jsonify({"lending_request": req.to_dict()}), 200
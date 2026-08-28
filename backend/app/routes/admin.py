from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from app.extensions import db
from app.models import PurchaseOrder, LendingRequest, Book, User
from app.utils import admin_required

admin_bp = Blueprint("admin", __name__)

LENDING_PERIOD_DAYS = 14


@admin_bp.get("/orders")
@admin_required
def list_all_orders():
    orders = PurchaseOrder.query.order_by(PurchaseOrder.created_at.desc()).all()
    return jsonify({"orders": [o.to_dict() for o in orders]}), 200


@admin_bp.post("/orders/<int:order_id>/approve")
@admin_required
def approve_order(order_id):
    order = PurchaseOrder.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    order.status = "approved"
    db.session.commit()
    return jsonify({"order": order.to_dict()}), 200


@admin_bp.post("/orders/<int:order_id>/reject")
@admin_required
def reject_order(order_id):
    order = PurchaseOrder.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    order.status = "rejected"
    db.session.commit()
    return jsonify({"order": order.to_dict()}), 200


@admin_bp.get("/lending")
@admin_required
def list_all_lending():
    requests_ = LendingRequest.query.order_by(LendingRequest.requested_at.desc()).all()
    return jsonify({"lending_requests": [r.to_dict() for r in requests_]}), 200


@admin_bp.post("/lending/<int:request_id>/approve")
@admin_required
def approve_lending(request_id):
    req = LendingRequest.query.get(request_id)
    if not req:
        return jsonify({"error": "Lending request not found"}), 404
    if req.book.available_copies < 1:
        return jsonify({"error": "No available copies left to lend"}), 400

    req.status = "approved"
    req.approved_at = datetime.utcnow()
    req.due_date = datetime.utcnow() + timedelta(days=LENDING_PERIOD_DAYS)
    req.book.available_copies -= 1
    db.session.commit()
    return jsonify({"lending_request": req.to_dict()}), 200


@admin_bp.post("/lending/<int:request_id>/reject")
@admin_required
def reject_lending(request_id):
    req = LendingRequest.query.get(request_id)
    if not req:
        return jsonify({"error": "Lending request not found"}), 404
    req.status = "rejected"
    db.session.commit()
    return jsonify({"lending_request": req.to_dict()}), 200


@admin_bp.post("/lending/<int:request_id>/confirm-return")
@admin_required
def confirm_return(request_id):
    """Admin confirms a physically-returned book, freeing up a library copy."""
    req = LendingRequest.query.get(request_id)
    if not req:
        return jsonify({"error": "Lending request not found"}), 404
    if req.status != "return_requested":
        return jsonify({"error": "Book has not been marked as return-requested"}), 400

    req.status = "returned"
    req.returned_at = datetime.utcnow()
    req.book.available_copies += 1
    db.session.commit()
    return jsonify({"lending_request": req.to_dict()}), 200


@admin_bp.get("/books")
@admin_required
def list_all_books_admin():
    books = Book.query.order_by(Book.date_uploaded.desc()).all()
    return jsonify({"books": [b.to_dict() for b in books]}), 200


@admin_bp.get("/users")
@admin_required
def list_all_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200
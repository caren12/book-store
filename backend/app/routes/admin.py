from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from app.extensions import db
from app.models import PurchaseOrder, LendingRequest, Book, User
from app.utils import admin_required

admin_bp = Blueprint("admin", __name__)

LENDING_PERIOD_DAYS = 14


@admin_bp.get("/summary")
@admin_required
def admin_summary():
    """Dashboard summary stats (admin only)
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    responses:
      200:
        description: Aggregate counts for the admin dashboard
        schema:
          type: object
          properties:
            total_users:
              type: integer
            total_books:
              type: integer
            total_orders:
              type: integer
            unpaid_orders:
              type: integer
            pending_lending_requests:
              type: integer
            active_loans:
              type: integer
            total_revenue:
              type: number
    """
    total_users = User.query.count()
    total_books = Book.query.count()
    total_orders = PurchaseOrder.query.count()
    unpaid_orders = PurchaseOrder.query.filter_by(payment_status="unpaid").count()
    pending_lending_requests = LendingRequest.query.filter_by(status="pending").count()
    active_loans = LendingRequest.query.filter_by(status="approved").count()

    paid_orders = PurchaseOrder.query.filter_by(payment_status="paid").all()
    total_revenue = sum(float(o.total_amount) for o in paid_orders)

    return jsonify({
        "total_users": total_users,
        "total_books": total_books,
        "total_orders": total_orders,
        "unpaid_orders": unpaid_orders,
        "pending_lending_requests": pending_lending_requests,
        "active_loans": active_loans,
        "total_revenue": total_revenue,
    }), 200


def _admin_order_summary(order):
    """Shape a PurchaseOrder for the admin orders table: flat fields the
    AdminOrders.jsx component reads directly (user_email, items as a
    display string, total, and a collapsed status vocabulary), rather
    than the full nested to_dict() used by the customer-facing order view."""
    if order.status == "rejected":
        display_status = "cancelled"
    elif order.payment_status == "paid":
        display_status = "completed"
    else:
        display_status = "pending"

    item_titles = [i.book.title for i in order.items if i.book]
    items_display = ", ".join(item_titles) if item_titles else f"{len(order.items)} item(s)"

    return {
        "id": order.id,
        "user_email": order.user.email if order.user else None,
        "items": items_display,
        "total": float(order.total_amount) if order.total_amount is not None else 0,
        "status": display_status,
        "raw_status": order.status,               # original admin-workflow status, if needed later
        "payment_status": order.payment_status,
        "created_at": order.created_at.isoformat() if order.created_at else None,
    }


@admin_bp.get("/orders")
@admin_required
def list_all_orders():
    """List all purchase orders (admin only)
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    responses:
      200:
        description: All purchase orders, newest first, shaped for the admin dashboard table
        schema:
          type: object
          properties:
            orders:
              type: array
              items:
                type: object
    """
    orders = PurchaseOrder.query.order_by(PurchaseOrder.created_at.desc()).all()
    return jsonify({"orders": [_admin_order_summary(o) for o in orders]}), 200


def _admin_lending_summary(req):
    """Shape a LendingRequest for the admin table, including the borrower's
    email — the base to_dict() doesn't include this since the customer-facing
    view already knows who they are."""
    data = req.to_dict()
    data["user"] = {"email": req.user.email if req.user else None}
    return data


@admin_bp.get("/lending")
@admin_required
def list_all_lending():
    """List all lending requests (admin only)
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    responses:
      200:
        description: All lending requests, newest first, including borrower email
        schema:
          type: object
          properties:
            lending_requests:
              type: array
              items:
                type: object
    """
    requests_ = LendingRequest.query.order_by(LendingRequest.requested_at.desc()).all()
    return jsonify({"lending_requests": [_admin_lending_summary(r) for r in requests_]}), 200


@admin_bp.post("/lending/<int:request_id>/approve")
@admin_required
def approve_lending(request_id):
    """Approve a pending lending request (admin only)
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    description: >
      Sets status to approved, stamps approved_at, sets a due_date 14 days out,
      and decrements the book's available_copies by one.
    parameters:
      - name: request_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Lending request approved
        schema:
          type: object
          properties:
            lending_request:
              type: object
      400:
        description: No available copies left to lend
      404:
        description: Lending request not found
    """
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
    """Reject a pending lending request (admin only)
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    parameters:
      - name: request_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Lending request rejected
        schema:
          type: object
          properties:
            lending_request:
              type: object
      404:
        description: Lending request not found
    """
    req = LendingRequest.query.get(request_id)
    if not req:
        return jsonify({"error": "Lending request not found"}), 404
    req.status = "rejected"
    db.session.commit()
    return jsonify({"lending_request": req.to_dict()}), 200


@admin_bp.post("/lending/<int:request_id>/confirm-return")
@admin_required
def confirm_return(request_id):
    """Confirm a physically-returned book (admin only)
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    description: Admin confirms a physically-returned book, freeing up a library copy.
    parameters:
      - name: request_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Return confirmed, book made available again
        schema:
          type: object
          properties:
            lending_request:
              type: object
      400:
        description: Book has not been marked as return-requested
      404:
        description: Lending request not found
    """
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
    """List all books, including out-of-catalog details (admin only)
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    responses:
      200:
        description: All books, newest uploaded first
        schema:
          type: object
          properties:
            books:
              type: array
              items:
                type: object
    """
    books = Book.query.order_by(Book.date_uploaded.desc()).all()
    return jsonify({"books": [b.to_dict() for b in books]}), 200


@admin_bp.get("/users")
@admin_required
def list_all_users():
    """List all registered users (admin only)
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    responses:
      200:
        description: All users, newest first
        schema:
          type: object
          properties:
            users:
              type: array
              items:
                type: object
    """
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200
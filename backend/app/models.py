from datetime import datetime
from app.extensions import db, bcrypt


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")  # "user" | "admin"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    cart_items = db.relationship("CartItem", backref="user", cascade="all, delete-orphan")
    orders = db.relationship("PurchaseOrder", backref="user", cascade="all, delete-orphan")
    lending_requests = db.relationship("LendingRequest", backref="user", cascade="all, delete-orphan")

    def set_password(self, raw_password):
        self.password_hash = bcrypt.generate_password_hash(raw_password).decode("utf-8")

    def check_password(self, raw_password):
        return bcrypt.check_password_hash(self.password_hash, raw_password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Book(db.Model):
    """Book records are keyed by Google Books volume ID (a string,
    e.g. "d_wvEQAAQBAJ") rather than an auto-incrementing integer,
    since all book data originates from the Google Books API. A row
    is created here the first time a given Google Books volume is
    added to a cart (see services/google_books.py)."""
    __tablename__ = "books"

    id = db.Column(db.String(64), primary_key=True)  # Google Books volume ID
    title = db.Column(db.String(255), nullable=False, index=True)
    author = db.Column(db.String(255), nullable=False)
    genre = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text, default="")
    cover_url = db.Column(db.String(500), default="")
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0)  # store price
    is_in_store = db.Column(db.Boolean, default=True)      # available for purchase
    is_in_library = db.Column(db.Boolean, default=False)   # available for lending
    total_copies = db.Column(db.Integer, default=1)         # library copies for lending
    available_copies = db.Column(db.Integer, default=1)
    date_uploaded = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "genre": self.genre,
            "description": self.description,
            "cover_url": self.cover_url,
            "price": float(self.price) if self.price is not None else 0,
            "is_in_store": self.is_in_store,
            "is_in_library": self.is_in_library,
            "total_copies": self.total_copies,
            "available_copies": self.available_copies,
            "date_uploaded": self.date_uploaded.isoformat() if self.date_uploaded else None,
        }


class CartItem(db.Model):
    """A single line item in a user's cart. cart_type distinguishes
    the purchasing cart from the lending cart."""
    __tablename__ = "cart_items"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    book_id = db.Column(db.String(64), db.ForeignKey("books.id"), nullable=False)
    cart_type = db.Column(db.String(20), nullable=False)  # "purchase" | "lending"
    quantity = db.Column(db.Integer, default=1)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    book = db.relationship("Book")

    def to_dict(self):
        return {
            "id": self.id,
            "cart_type": self.cart_type,
            "quantity": self.quantity,
            "book": self.book.to_dict() if self.book else None,
        }


class PurchaseOrder(db.Model):
    __tablename__ = "purchase_orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending, approved, rejected
    payment_status = db.Column(db.String(20), default="unpaid")  # unpaid, pending, paid, failed
    total_amount = db.Column(db.Numeric(10, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # --- M-Pesa / BUNI STK Push tracking ---
    mpesa_phone_number = db.Column(db.String(15), nullable=True)
    mpesa_merchant_request_id = db.Column(db.String(100), nullable=True)
    mpesa_checkout_request_id = db.Column(db.String(100), nullable=True, index=True)
    mpesa_receipt_number = db.Column(db.String(50), nullable=True)
    mpesa_result_desc = db.Column(db.String(255), nullable=True)

    # --- Flutterwave card payment tracking ---
    flw_customer_id = db.Column(db.String(100), nullable=True)
    flw_charge_id = db.Column(db.String(100), nullable=True, index=True)
    flw_reference = db.Column(db.String(100), nullable=True)
    flw_redirect_url = db.Column(db.String(500), nullable=True)
    flw_status_detail = db.Column(db.String(255), nullable=True)

    items = db.relationship("OrderItem", backref="order", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "status": self.status,
            "payment_status": self.payment_status,
            "total_amount": float(self.total_amount) if self.total_amount is not None else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "items": [i.to_dict() for i in self.items],
            "mpesa_phone_number": self.mpesa_phone_number,
            "mpesa_checkout_request_id": self.mpesa_checkout_request_id,
            "mpesa_receipt_number": self.mpesa_receipt_number,
            "mpesa_result_desc": self.mpesa_result_desc,
            "flw_charge_id": self.flw_charge_id,
            "flw_reference": self.flw_reference,
            "flw_redirect_url": self.flw_redirect_url,
            "flw_status_detail": self.flw_status_detail,
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("purchase_orders.id"), nullable=False)
    book_id = db.Column(db.String(64), db.ForeignKey("books.id"), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    unit_price = db.Column(db.Numeric(10, 2), default=0)

    book = db.relationship("Book")

    def to_dict(self):
        return {
            "id": self.id,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price) if self.unit_price is not None else 0,
            "book": self.book.to_dict() if self.book else None,
        }


class LendingRequest(db.Model):
    __tablename__ = "lending_requests"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    book_id = db.Column(db.String(64), db.ForeignKey("books.id"), nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending, approved, rejected, returned, return_requested
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime, nullable=True)
    due_date = db.Column(db.DateTime, nullable=True)
    returned_at = db.Column(db.DateTime, nullable=True)

    book = db.relationship("Book")

    def to_dict(self):
        return {
            "id": self.id,
            "status": self.status,
            "requested_at": self.requested_at.isoformat() if self.requested_at else None,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "returned_at": self.returned_at.isoformat() if self.returned_at else None,
            "book": self.book.to_dict() if self.book else None,
        }
from flask import Flask
from config import Config
from app.extensions import db, migrate, jwt, bcrypt, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"]}}, supports_credentials=True)

    from app.routes.auth import auth_bp
    from app.routes.books import books_bp
    from app.routes.cart import cart_bp
    from app.routes.orders import orders_bp
    from app.routes.lending import lending_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(books_bp, url_prefix="/api/books")
    app.register_blueprint(cart_bp, url_prefix="/api/cart")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(lending_bp, url_prefix="/api/lending")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    """Register a new user
    ---
    tags:
      - Auth
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - name
            - email
            - password
          properties:
            name:
              type: string
            email:
              type: string
            password:
              type: string
    responses:
      201:
        description: User created, returns user object and JWT access token
        schema:
          type: object
          properties:
            user:
              type: object
            access_token:
              type: string
      400:
        description: Missing required fields
      409:
        description: An account with this email already exists
    """
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(name=name, email=email, role="user")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"user": user.to_dict(), "access_token": token}), 201


@auth_bp.post("/login")
def login():
    """Log in a user
    ---
    tags:
      - Auth
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
            password:
              type: string
    responses:
      200:
        description: Login successful, returns user object and JWT access token
        schema:
          type: object
          properties:
            user:
              type: object
            access_token:
              type: string
      401:
        description: Invalid email or password
    """
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"user": user.to_dict(), "access_token": token}), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    """Get the currently authenticated user
    ---
    tags:
      - Auth
    security:
      - Bearer: []
    responses:
      200:
        description: The authenticated user's profile
        schema:
          type: object
          properties:
            user:
              type: object
      404:
        description: User not found
    """
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200
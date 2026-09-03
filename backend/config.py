import os
from dotenv import load_dotenv
load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "postgresql://booked_user:booked_pass@localhost:5432/booked_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret")
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
    GOOGLE_BOOKS_API_KEY = os.environ.get("GOOGLE_BOOKS_API_KEY")

    # --- BUNI / KCB M-Pesa STK Push ---
    BUNI_CONSUMER_KEY = os.environ.get("BUNI_CONSUMER_KEY")
    BUNI_CONSUMER_SECRET = os.environ.get("BUNI_CONSUMER_SECRET")
    BUNI_BASE_URL = os.environ.get("BUNI_BASE_URL", "https://uat.buni.kcbgroup.com")
    BUNI_SHORTCODE = os.environ.get("BUNI_SHORTCODE")          # test paybill/till from sandbox
    BUNI_CALLBACK_URL = os.environ.get("BUNI_CALLBACK_URL")    # your ngrok URL + /api/orders/mpesa/callback

    # --- Flutterwave v4 (card payments) ---
    FLW_CLIENT_ID = os.environ.get("FLW_CLIENT_ID")
    FLW_CLIENT_SECRET = os.environ.get("FLW_CLIENT_SECRET")
    FLW_ENCRYPTION_KEY = os.environ.get("FLW_ENCRYPTION_KEY")
    FLW_TOKEN_URL = os.environ.get(
        "FLW_TOKEN_URL", "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token"
    )
    FLW_BASE_URL = os.environ.get("FLW_BASE_URL", "https://api.flutterwave.com")
    FLW_WEBHOOK_HASH = os.environ.get("FLW_WEBHOOK_HASH")   # the hash/secret you set on the webhook in the dashboard
    FLW_REDIRECT_URL = os.environ.get("FLW_REDIRECT_URL")   # where Flutterwave sends the browser back after payment
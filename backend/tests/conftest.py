import pytest
from app import create_app
from app.extensions import db as _db
from config import Config


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def register_user(client, email="test@example.com", password="password123", name="Test User"):
    return client.post("/api/auth/register", json={"name": name, "email": email, "password": password})


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}
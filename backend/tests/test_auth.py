from tests.conftest import register_user


def test_register_creates_user(client):
    resp = register_user(client)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["user"]["email"] == "test@example.com"
    assert "access_token" in body


def test_register_duplicate_email_fails(client):
    register_user(client)
    resp = register_user(client)
    assert resp.status_code == 409


def test_login_success(client):
    register_user(client)
    resp = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password123"})
    assert resp.status_code == 200
    assert "access_token" in resp.get_json()


def test_login_wrong_password_fails(client):
    register_user(client)
    resp = client.post("/api/auth/login", json={"email": "test@example.com", "password": "wrong"})
    assert resp.status_code == 401
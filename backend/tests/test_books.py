from tests.conftest import register_user, auth_header


def make_admin(app, email="admin@example.com"):
    from app.extensions import db
    from app.models import User
    with app.app_context():
        user = User(name="Admin", email=email, role="admin")
        user.set_password("password123")
        db.session.add(user)
        db.session.commit()


def test_list_books_empty(client):
    resp = client.get("/api/books")
    assert resp.status_code == 200
    assert resp.get_json()["books"] == []


def test_create_book_requires_admin(client):
    reg = register_user(client)
    token = reg.get_json()["access_token"]
    resp = client.post("/api/books", json={"title": "X", "author": "Y", "genre": "Z"},
                        headers=auth_header(token))
    assert resp.status_code == 403


def test_admin_can_create_book(app, client):
    make_admin(app)
    login = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "password123"})
    token = login.get_json()["access_token"]

    resp = client.post("/api/books", json={
        "title": "The Hobbit", "author": "Tolkien", "genre": "Fantasy", "price": 12.5
    }, headers=auth_header(token))
    assert resp.status_code == 201
    assert resp.get_json()["book"]["title"] == "The Hobbit"

    listing = client.get("/api/books")
    assert len(listing.get_json()["books"]) == 1

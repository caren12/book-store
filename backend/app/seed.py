"""Seed the database with a demo admin, a demo user, and sample books.
Run with:  python -m app.seed
"""
from app import create_app
from app.extensions import db
from app.models import User, Book

SAMPLE_BOOKS = [
    dict(title="The Hobbit", author="J.R.R. Tolkien", genre="Fantasy",
         description="A hobbit's unexpected journey.", price=15.99,
         is_in_store=True, is_in_library=True, total_copies=3, available_copies=3),
    dict(title="Dune", author="Frank Herbert", genre="Science Fiction",
         description="Politics and prophecy on a desert planet.", price=18.50,
         is_in_store=True, is_in_library=True, total_copies=2, available_copies=2),
    dict(title="Sapiens", author="Yuval Noah Harari", genre="Non-Fiction",
         description="A brief history of humankind.", price=22.00,
         is_in_store=True, is_in_library=False, total_copies=0, available_copies=0),
    dict(title="Circe", author="Madeline Miller", genre="Fantasy",
         description="A retelling of the witch of Aeaea.", price=16.75,
         is_in_store=False, is_in_library=True, total_copies=4, available_copies=4),
    dict(title="Atomic Habits", author="James Clear", genre="Self-Help",
         description="Tiny changes, remarkable results.", price=19.99,
         is_in_store=True, is_in_library=True, total_copies=2, available_copies=2),
]


def run():
    app = create_app()
    with app.app_context():
        db.create_all()

        if not User.query.filter_by(email="admin@booked.com").first():
            admin = User(name="Admin", email="admin@booked.com", role="admin")
            admin.set_password("admin123")
            db.session.add(admin)

        if not User.query.filter_by(email="reader@booked.com").first():
            reader = User(name="Demo Reader", email="reader@booked.com", role="user")
            reader.set_password("reader123")
            db.session.add(reader)

        if Book.query.count() == 0:
            for b in SAMPLE_BOOKS:
                db.session.add(Book(**b))

        db.session.commit()
        print("Seed complete. Admin login: admin@booked.com / admin123")


if __name__ == "__main__":
    run()
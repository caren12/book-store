"""Seed the database with a demo admin, a demo user, and sample books.
Run with:  python -m app.seed
"""
from app import create_app
from app.extensions import db
from app.models import User, Book


import { useEffect, useState } from "react";
import api from "../../services/api";

const BLANK_FORM = {
  title: "", author: "", genre: "", description: "", cover_url: "",
  price: "", is_in_store: true, is_in_library: false, total_copies: 1,
};

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(BLANK_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const loadBooks = async () => {
    const res = await api.get("/admin/books");
    setBooks(res.data.books);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const resetForm = () => {
    setForm(BLANK_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = { ...form, price: parseFloat(form.price) || 0, total_copies: parseInt(form.total_copies) || 0 };
    try {
      if (editingId) {
        await api.put(`/books/${editingId}`, payload);
      } else {
        await api.post("/books", payload);
      }
      resetForm();
      loadBooks();
    } catch (err) {
      setError(err.response?.data?.error || "Could not save book");
    }
  };

  const handleEdit = (book) => {
    setEditingId(book.id);
    setForm({
      title: book.title, author: book.author, genre: book.genre,
      description: book.description, cover_url: book.cover_url,
      price: book.price, is_in_store: book.is_in_store, is_in_library: book.is_in_library,
      total_copies: book.total_copies,
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this book?")) return;
    await api.delete(`/books/${id}`);
    loadBooks();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8">
      <div>
        <h1 className="font-display text-2xl mb-4">{editingId ? "Edit Book" : "Add a Book"}</h1>
        <form onSubmit={handleSubmit} className="space-y-3 bg-parchment border border-ink/15 rounded-sm p-4">
          <input required placeholder="Title" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-ink/30 rounded-sm px-3 py-2 bg-paper text-sm" />
          <input required placeholder="Author" value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            className="w-full border border-ink/30 rounded-sm px-3 py-2 bg-paper text-sm" />
          <input required placeholder="Genre" value={form.genre}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
            className="w-full border border-ink/30 rounded-sm px-3 py-2 bg-paper text-sm" />
          <textarea placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-ink/30 rounded-sm px-3 py-2 bg-paper text-sm" rows={3} />
          <input placeholder="Cover image URL" value={form.cover_url}
            onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
            className="w-full border border-ink/30 rounded-sm px-3 py-2 bg-paper text-sm" />
          <div className="flex gap-3">
            <input type="number" step="0.01" placeholder="Price" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-1/2 border border-ink/30 rounded-sm px-3 py-2 bg-paper text-sm" />
            <input type="number" placeholder="Library copies" value={form.total_copies}
              onChange={(e) => setForm({ ...form, total_copies: e.target.value })}
              className="w-1/2 border border-ink/30 rounded-sm px-3 py-2 bg-paper text-sm" />
          </div>
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_in_store}
                onChange={(e) => setForm({ ...form, is_in_store: e.target.checked })} />
              In shop
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_in_library}
                onChange={(e) => setForm({ ...form, is_in_library: e.target.checked })} />
              In library
            </label>
          </div>
          {error && <p className="text-sm text-burgundy">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-brass transition">
              {editingId ? "Save changes" : "Add book"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-sm underline text-ink/60">Cancel</button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2 className="font-display text-2xl mb-4">All Titles ({books.length})</h2>
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {books.map((b) => (
            <div key={b.id} className="bg-parchment border border-ink/15 rounded-sm p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{b.title}</p>
                <p className="text-xs text-ink/60">{b.genre} · ${b.price.toFixed(2)} · {b.available_copies}/{b.total_copies} library copies</p>
              </div>
              <div className="flex gap-2 text-sm">
                <button onClick={() => handleEdit(b)} className="underline text-brass">Edit</button>
                <button onClick={() => handleDelete(b.id)} className="underline text-burgundy">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

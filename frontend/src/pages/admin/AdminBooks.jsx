import { useEffect, useState } from "react";
import { fetchAdminBooks } from "../../services/adminService";

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchAdminBooks()
      .then((data) => {
        if (isMounted) {
          setBooks(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error || "Could not load books");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-ink/50">Loading books...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-800">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="font-display text-2xl text-ink mb-1">Manage Books</h1>
      <p className="text-sm text-ink/50 mb-6">
        {books.length} book{books.length !== 1 ? "s" : ""} in the catalog.
      </p>

      <div className="overflow-x-auto border border-ink/20 rounded-sm">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-widest text-ink/50">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Author</th>
              <th className="p-3">Genre</th>
              <th className="p-3">Price</th>
              <th className="p-3">Store</th>
              <th className="p-3">Library Copies</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id} className="border-t border-ink/10">
                <td className="p-3 font-medium text-ink">{book.title}</td>
                <td className="p-3 text-ink/70">{book.author}</td>
                <td className="p-3 text-ink/70">{book.genre}</td>
                <td className="p-3 text-ink/70">${Number(book.price).toFixed(2)}</td>
                <td className="p-3 text-ink/70">{book.is_in_store ? "Yes" : "No"}</td>
                <td className="p-3 text-ink/70">
                  {book.is_in_library ? `${book.available_copies}/${book.total_copies}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
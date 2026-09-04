import { useState } from "react";

async function searchGoogleBooks(query) {
  const response = await fetch(`/api/books/search/google?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Google Books request failed");
  const data = await response.json();
  return data.items || [];
}

export default function GoogleBooksSearch() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const results = await searchGoogleBooks(query);
      setBooks(results);
    } catch (err) {
      setError("Could not fetch results. Please try again.");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl mb-2">Search Google Books</h1>
      <p className="text-ink/60 mb-6">Live lookup, separate from Booked's own catalog.</p>
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or topic…"
          className="flex-1 border border-ink/30 rounded-sm px-3 py-2 bg-parchment"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-ink text-paper px-5 py-2 rounded-sm font-medium hover:bg-accent transition disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>
      {error && <p className="text-sm text-burgundy mb-4">{error}</p>}
      {searched && !loading && !error && books.length === 0 && (
        <p className="text-ink/50 italic">No results found.</p>
      )}
      <div className="space-y-4">
        {books.map((book) => {
          const info = book.volumeInfo || {};
          const thumbnail = info.imageLinks?.thumbnail;
          return (
            <div key={book.id} className="bg-parchment border border-ink/15 rounded-sm p-4 flex gap-4">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={info.title || "Book cover"}
                  className="w-20 h-28 object-cover rounded-sm cursor-pointer"
                  onClick={() => info.previewLink && window.open(info.previewLink, "_blank")}
                />
              ) : (
                <div className="w-20 h-28 bg-ink/10 rounded-sm flex-shrink-0" />
              )}
              <div>
                <h3 className="font-display text-lg leading-tight">{info.title || "No Title"}</h3>
                <p className="text-sm text-ink/60 mb-1">
                  {info.authors ? `By: ${info.authors.join(", ")}` : "Unknown Author"}
                </p>
                <p className="text-sm text-ink/70 line-clamp-3">
                  {info.description || "No description available."}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
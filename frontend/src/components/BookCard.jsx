import { Link } from "react-router-dom";

export default function BookCard({ book }) {
  return (
    <Link
      to={`/books/${book.id}`}
      className="block bg-parchment border border-ink/20 rounded-sm p-4 hover:shadow-lg hover:-translate-y-0.5 transition-transform"
    >
      <div className="aspect-[3/4] bg-ink/5 rounded-sm mb-3 flex items-center justify-center overflow-hidden">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-3xl text-ink/30">{book.title.charAt(0)}</span>
        )}
      </div>
      <h3 className="font-display text-lg leading-tight text-ink">{book.title}</h3>
      <p className="text-sm text-ink/60 mb-2">{book.author}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="card-stamp border-brass text-brass">{book.genre}</span>
        {book.is_in_store && <span className="font-semibold text-ink">${book.price.toFixed(2)}</span>}
      </div>
      <div className="mt-2 flex gap-1 flex-wrap">
        {book.is_in_store && (
          <span className="card-stamp border-burgundy text-burgundy">Shop</span>
        )}
        {book.is_in_library && (
          <span className="card-stamp border-forest text-forest">
            {book.available_copies > 0 ? "Library" : "On loan"}
          </span>
        )}
      </div>
    </Link>
  );
}
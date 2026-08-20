import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookDetail } from "../features/books/booksSlice";
import { addToCart } from "../features/cart/cartSlice";

export default function BookDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedBook: book } = useSelector((state) => state.books);
  const { token } = useSelector((state) => state.auth);
  const [message, setMessage] = useState("");

  useEffect(() => {
    dispatch(fetchBookDetail(id));
  }, [dispatch, id]);

  const handleAdd = async (cartType) => {
    if (!token) {
      navigate("/login");
      return;
    }
    const res = await dispatch(addToCart({ bookId: book.id, cartType }));
    if (addToCart.fulfilled.match(res)) {
      setMessage(cartType === "purchase" ? "Added to your purchase cart." : "Added to your lending cart.");
    } else {
      setMessage(res.payload || "Could not add to cart.");
    }
  };

  if (!book) return <div className="max-w-4xl mx-auto px-4 py-10 text-ink/50">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
      <div className="aspect-[3/4] bg-parchment rounded-sm flex items-center justify-center">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover rounded-sm" />
        ) : (
          <span className="font-display text-6xl text-ink/20">{book.title.charAt(0)}</span>
        )}
      </div>

      <div>
        <span className="card-stamp border-brass text-brass mb-3">{book.genre}</span>
        <h1 className="font-display text-3xl mt-2 mb-1">{book.title}</h1>
        <p className="text-ink/60 mb-4">by {book.author}</p>
        <p className="text-ink/80 leading-relaxed mb-6">{book.description || "No description available yet."}</p>

        {message && <p className="text-sm text-forest mb-4">{message}</p>}

        <div className="flex flex-col gap-3 max-w-xs">
          {book.is_in_store && (
            <button
              onClick={() => handleAdd("purchase")}
              className="bg-burgundy text-paper py-2.5 rounded-sm font-medium hover:opacity-90 transition"
            >
              Buy for ${book.price.toFixed(2)}
            </button>
          )}
          {book.is_in_library && (
            <button
              onClick={() => handleAdd("lending")}
              disabled={book.available_copies < 1}
              className="border-2 border-forest text-forest py-2.5 rounded-sm font-medium hover:bg-forest hover:text-paper transition disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-forest"
            >
              {book.available_copies > 0 ? "Borrow from library" : "No copies available"}
            </button>
          )}
          {!book.is_in_store && !book.is_in_library && (
            <p className="text-sm text-ink/50 italic">This title is currently unavailable.</p>
          )}
        </div>
      </div>
    </div>
  );
}

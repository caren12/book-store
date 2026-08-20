import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { fetchBooks, fetchGenres, setFilters, resetFilters } from "../features/books/booksSlice";
import BookCard from "../components/BookCard";
import SearchFilterBar from "../components/SearchFilterBar";

export default function Home() {
  const dispatch = useDispatch();
  const { items, genres, filters, status } = useSelector((state) => state.books);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const section = searchParams.get("section");
    if (section) dispatch(setFilters({ section }));
  }, [searchParams, dispatch]);

  useEffect(() => {
    dispatch(fetchGenres());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchBooks(filters));
  }, [dispatch, filters]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">
          {filters.section === "library" ? "The Library" : filters.section === "store" ? "The Shop" : "Buy or Borrow"}
        </h1>
        <p className="text-ink/60 max-w-xl">
          Browse our shelves. Purchase a copy to keep, or borrow one from the library and return it when you're done.
        </p>
      </div>

      <SearchFilterBar
        filters={filters}
        genres={genres}
        onChange={(patch) => dispatch(setFilters(patch))}
        onReset={() => dispatch(resetFilters())}
      />

      {status === "loading" && <p className="text-ink/50">Loading books…</p>}
      {status === "succeeded" && items.length === 0 && (
        <p className="text-ink/50 italic">No books match your search yet. Try widening your filters.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}

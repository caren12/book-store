import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

const FALLBACK_GENRES = [
  "Fiction", "Fantasy", "Science Fiction", "Mystery", "Romance",
  "Non-Fiction", "Biography", "Self-Help", "History", "Thriller",
];

function hashToUnit(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

function mapVolumeToBook(item) {
  const info = item.volumeInfo || {};
  const sale = item.saleInfo || {};
  const rand = hashToUnit(item.id);

  const price = sale.listPrice?.amount
    ? Number(sale.listPrice.amount)
    : Math.round((9.99 + rand * 20) * 100) / 100;

  const isInLibrary = rand < 0.55;
  const totalCopies = isInLibrary ? Math.ceil(rand * 5) : 0;

  return {
    id: item.id,
    title: info.title || "Untitled",
    author: (info.authors && info.authors[0]) || "Unknown Author",
    genre: (info.categories && info.categories[0]?.split("/")[0]) || "General",
    description: info.description || "",
    cover_url: (info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || "").replace("http://", "https://"),
    price,
    is_in_store: true,
    is_in_library: isInLibrary,
    total_copies: totalCopies,
    available_copies: rand < 0.15 ? 0 : totalCopies,
    date_uploaded: info.publishedDate || new Date().toISOString(),
  };
}

async function fetchVolumes(query, maxResults = 40) {
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=${maxResults}${API_KEY ? `&key=${API_KEY}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Google Books request failed");
  const data = await res.json();
  return (data.items || []).map(mapVolumeToBook).filter((b) => b.cover_url);
}

export const fetchBooks = createAsyncThunk(
  "books/fetchBooks",
  async (filters = {}, { rejectWithValue }) => {
    try {
      let query = filters.q?.trim() || filters.genre?.trim() || "bestseller";
      if (filters.genre && filters.q) query = `${filters.q} subject:${filters.genre}`;
      else if (filters.genre) query = `subject:${filters.genre}`;

      let results = await fetchVolumes(query, 40);

      if (filters.section === "store") results = results.filter((b) => b.is_in_store);
      if (filters.section === "library") results = results.filter((b) => b.is_in_library);
      if (filters.min_price) results = results.filter((b) => b.price >= Number(filters.min_price));
      if (filters.max_price) results = results.filter((b) => b.price <= Number(filters.max_price));

      if (filters.sort === "price_asc") results.sort((a, b) => a.price - b.price);
      else if (filters.sort === "price_desc") results.sort((a, b) => b.price - a.price);
      else results.sort((a, b) => new Date(b.date_uploaded) - new Date(a.date_uploaded));

      return results;
    } catch (err) {
      return rejectWithValue("Could not load books from Google Books");
    }
  }
);

export const fetchGenres = createAsyncThunk("books/fetchGenres", async () => {
  return FALLBACK_GENRES;
});

export const fetchBookDetail = createAsyncThunk(
  "books/fetchBookDetail",
  async (bookId, { rejectWithValue }) => {
    try {
      const url = `${BASE_URL}/${bookId}${API_KEY ? `?key=${API_KEY}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Not found");
      const item = await res.json();
      return mapVolumeToBook(item);
    } catch (err) {
      return rejectWithValue("Book not found");
    }
  }
);

const booksSlice = createSlice({
  name: "books",
  initialState: {
    items: [],
    genres: [],
    selectedBook: null,
    filters: { q: "", genre: "", section: "", min_price: "", max_price: "", sort: "newest" },
    status: "idle",
    error: null,
  },
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters(state) {
      state.filters = { q: "", genre: "", section: "", min_price: "", max_price: "", sort: "newest" };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchGenres.fulfilled, (state, action) => {
        state.genres = action.payload;
      })
      .addCase(fetchBookDetail.fulfilled, (state, action) => {
        state.selectedBook = action.payload;
      });
  },
});

export const { setFilters, resetFilters } = booksSlice.actions;
export default booksSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchBooks = createAsyncThunk(
  "books/fetchBooks",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "" && v !== undefined && v !== null)
      );
      const res = await api.get("/books", { params });
      return res.data.books;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Could not load books");
    }
  }
);

export const fetchGenres = createAsyncThunk("books/fetchGenres", async () => {
  const res = await api.get("/books/genres");
  return res.data.genres;
});

export const fetchBookDetail = createAsyncThunk(
  "books/fetchBookDetail",
  async (bookId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/books/${bookId}`);
      return res.data.book;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Book not found");
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

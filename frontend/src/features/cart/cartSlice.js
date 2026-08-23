import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchCart = createAsyncThunk("cart/fetchCart", async () => {
  const res = await api.get("/cart");
  return res.data.items;
});

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ bookId, cartType, quantity = 1 }, { rejectWithValue }) => {
    try {
      const res = await api.post("/cart", { book_id: bookId, cart_type: cartType, quantity });
      return res.data.item;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Could not add to cart");
    }
  }
);

export const removeFromCart = createAsyncThunk("cart/removeFromCart", async (itemId) => {
  await api.delete(`/cart/${itemId}`);
  return itemId;
});

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {
    clearCartError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = "succeeded";
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
        else state.items.push(action.payload);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
      });
  },
});

export const { clearCartError } = cartSlice.actions;

export const selectPurchaseCart = (state) => state.cart.items.filter((i) => i.cart_type === "purchase");
export const selectLendingCart = (state) => state.cart.items.filter((i) => i.cart_type === "lending");

export default cartSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const checkoutPurchase = createAsyncThunk(
  "orders/checkoutPurchase",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post("/orders/checkout");
      return res.data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Checkout failed");
    }
  }
);

export const checkoutLending = createAsyncThunk(
  "orders/checkoutLending",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post("/lending/checkout");
      return res.data.lending_requests;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Lending checkout failed");
    }
  }
);

export const fetchMyOrders = createAsyncThunk("orders/fetchMyOrders", async () => {
  const res = await api.get("/orders");
  return res.data.orders;
});

export const fetchMyLending = createAsyncThunk("orders/fetchMyLending", async () => {
  const res = await api.get("/lending");
  return res.data.lending_requests;
});

export const payOrder = createAsyncThunk(
  "orders/payOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/orders/${orderId}/pay`);
      return res.data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Payment failed");
    }
  }
);

export const requestReturn = createAsyncThunk(
  "orders/requestReturn",
  async (requestId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/lending/${requestId}/return`);
      return res.data.lending_request;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Return request failed");
    }
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState: {
    purchaseOrders: [],
    lendingRequests: [],
    status: "idle",
    error: null,
  },
  reducers: {
    clearOrdersError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.purchaseOrders = action.payload;
      })
      .addCase(fetchMyLending.fulfilled, (state, action) => {
        state.lendingRequests = action.payload;
      })
      .addCase(checkoutPurchase.fulfilled, (state, action) => {
        state.purchaseOrders.unshift(action.payload);
      })
      .addCase(payOrder.fulfilled, (state, action) => {
        const idx = state.purchaseOrders.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) state.purchaseOrders[idx] = action.payload;
      })
      .addCase(requestReturn.fulfilled, (state, action) => {
        const idx = state.lendingRequests.findIndex((r) => r.id === action.payload.id);
        if (idx >= 0) state.lendingRequests[idx] = action.payload;
      })
      .addMatcher(
        (action) => action.type.startsWith("orders/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.error = action.payload;
        }
      );
  },
});

export const { clearOrdersError } = ordersSlice.actions;
export default ordersSlice.reducer;

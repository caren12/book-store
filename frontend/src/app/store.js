import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import booksReducer from "../features/books/booksSlice";
import cartReducer from "../features/cart/cartSlice";
import ordersReducer from "../features/orders/ordersSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    books: booksReducer,
    cart: cartReducer,
    orders: ordersReducer,
  },
});

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  totalPrice: 0,
  loading: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const book = action.payload;
      const existing = state.items.find((item) => String(item.bookId) === String(book.id));
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({
          bookId: String(book.id),
          title: book.title,
          price: book.price,
          image: book.image,
          stock: book.stock ?? 99,
          quantity: 1,
        });
      }
      state.totalPrice = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => String(item.bookId) !== String(action.payload));
      state.totalPrice = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalPrice = 0;
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";
import bookApi from "../../api/bookApi";

// Fetch cart from API for a user
export const fetchCart = createAsyncThunk("cart/fetchCart", async (userId) => {
  const res = await axiosClient.get(`/carts?userId=${userId}`);
  if (res.data.length === 0) return [];
  const cartData = res.data[0]; // user has one cart entry
  const booksRes = await bookApi.getAll();
  const books = booksRes.data;
  return (cartData.items || []).map((item) => {
    const book = books.find((b) => String(b.id) === String(item.bookId));
    return {
      bookId: item.bookId,
      title: book?.title || "",
      author: book?.author || "",
      price: book?.price || 0,
      image: book?.image || "",
      stock: book?.stock || 0,
      quantity: item.quantity,
    };
  });
});

// Sync cart to API
export const syncCartToApi = createAsyncThunk(
  "cart/syncCartToApi",
  async ({ userId, items }) => {
    // Check if cart exists for user
    const res = await axiosClient.get(`/carts?userId=${userId}`);
    const cartItems = items.map((item) => ({
      bookId: item.bookId,
      quantity: item.quantity,
    }));
    if (res.data.length > 0) {
      // Update existing cart
      await axiosClient.patch(`/carts/${res.data[0].id}`, {
        items: cartItems,
      });
    } else {
      // Create new cart
      await axiosClient.post("/carts", {
        userId: userId,
        items: cartItems,
      });
    }
  }
);

const initialState = {
  items: [],
  totalQuantity: 0,
  totalPrice: 0,
};

const recalculate = (state) => {
  state.totalQuantity = state.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  state.totalPrice = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const book = action.payload;
      const existing = state.items.find(
        (item) => String(item.bookId) === String(book.id)
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({
          bookId: book.id,
          title: book.title,
          author: book.author,
          price: book.price,
          image: book.image,
          stock: book.stock,
          quantity: 1,
        });
      }
      recalculate(state);
    },
    removeFromCart: (state, action) => {
      const bookId = action.payload;
      state.items = state.items.filter(
        (item) => String(item.bookId) !== String(bookId)
      );
      recalculate(state);
    },
    updateQuantity: (state, action) => {
      const { bookId, quantity } = action.payload;
      const item = state.items.find(
        (i) => String(i.bookId) === String(bookId)
      );
      if (item) {
        item.quantity = quantity;
      }
      recalculate(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalPrice = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      state.items = action.payload;
      recalculate(state);
    });
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;

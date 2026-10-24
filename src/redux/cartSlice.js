import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../api/axiosClient";
import bookApi from "../api/bookApi";

// Fetch cart from API for a user
export const fetchCart = createAsyncThunk("cart/fetchCart", async (userId) => {
  const res = await axiosClient.get("/carts");
  const userCarts = (res.data || []).filter(
    (c) => String(c.userId) === String(userId)
  );
  if (userCarts.length === 0) return [];
  const cartData = userCarts[0];
  const booksRes = await bookApi.getAll();
  const books = booksRes.data || [];
  return (cartData.items || []).map((item) => {
    const book = books.find(
      (b) => String(b.id) === String(item.bookId) || (item.title && b.title === item.title)
    );
    const validBookId = String(book?.id || item.bookId);
    const isInactive = Boolean(book?.isDeleted || book?.status === "Inactive");
    return {
      bookId: validBookId,
      title: book?.title || item.title || "",
      author: book?.author || item.author || "",
      price: book?.price || item.price || 0,
      image: book?.image || item.image || "",
      stock: book ? (book.stock ?? 0) : (item.stock ?? 0),
      status: book?.status || (isInactive ? "Inactive" : "Active"),
      isDeleted: isInactive,
      quantity: Math.max(1, item.quantity),
    };
  });
});

// Sync cart to API
export const syncCartToApi = createAsyncThunk(
  "cart/syncCartToApi",
  async ({ userId, items }) => {
    const res = await axiosClient.get("/carts");
    const userCarts = (res.data || []).filter(
      (c) => String(c.userId) === String(userId)
    );
    const cartItems = items.map((item) => ({
      bookId: String(item.bookId),
      quantity: Math.max(1, Number(item.quantity) || 1),
    }));
    if (userCarts.length > 0) {
      await axiosClient.patch(`/carts/${userCarts[0].id}`, {
        items: cartItems,
      });
      if (userCarts.length > 1) {
        for (let i = 1; i < userCarts.length; i++) {
          try {
            await axiosClient.delete(`/carts/${userCarts[i].id}`);
          } catch (e) {
            console.error("Clean duplicate cart error:", e);
          }
        }
      }
    } else {
      await axiosClient.post("/carts", {
        userId: String(userId),
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
      const targetBookId = String(book.bookId || book.id);
      const stock = Number(book.stock) || 0;
      const isUnavailable =
        stock <= 0 ||
        book.isDeleted ||
        book.status === "Inactive" ||
        book.status === "Out of Stock";

      if (isUnavailable) {
        return;
      }

      const existing = state.items.find(
        (item) => String(item.bookId) === targetBookId
      );
      if (existing) {
        if (existing.quantity < stock) {
          existing.quantity += 1;
        }
      } else {
        state.items.push({
          bookId: targetBookId,
          title: book.title,
          author: book.author,
          price: Number(book.price) || 0,
          image: book.image,
          stock: stock,
          status: book.status || "Active",
          isDeleted: Boolean(book.isDeleted || book.status === "Inactive"),
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
        let validQty = Number(quantity) || 1;
        if (validQty < 1) validQty = 1;
        if (item.stock != null && item.stock > 0 && validQty > item.stock) {
          validQty = item.stock;
        }
        item.quantity = validQty;
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


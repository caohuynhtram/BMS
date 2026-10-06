import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../api/axiosClient";
import bookApi from "../api/bookApi";

// Fetch wishlist from API for a user
export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (userId) => {
    const res = await axiosClient.get("/wishlists");
    const wishlistItems = (res.data || []).filter(
      (item) => String(item.userId) === String(userId)
    );
    const booksRes = await bookApi.getAll();
    const books = booksRes.data || [];
    return (wishlistItems || [])
      .filter((item) => item && (item.bookId || item.id))
      .map((item) => {
        const book = books.find(
          (b) => String(b.id) === String(item.bookId || item.id)
        );
        return {
          id: item.id,
          bookId: String(item.bookId || item.id),
          title: book?.title || item.title || "",
          author: book?.author || item.author || "",
          price: Number(book?.price || item.price || 0),
          image: book?.image || item.image || "",
          stock: book ? Number(book.stock ?? 0) : Number(item.stock ?? 0),
          status: book?.status || (book?.isDeleted ? "Inactive" : "Active"),
          isDeleted: Boolean(book?.isDeleted),
        };
      });
  }
);

// Add item to wishlist via API
export const addWishlistItem = createAsyncThunk(
  "wishlist/addWishlistItem",
  async ({ userId, book }) => {
    const res = await axiosClient.post("/wishlists", {
      userId: String(userId),
      bookId: String(book.id),
    });
    return {
      id: res.data.id,
      bookId: String(book.id),
      title: book.title,
      author: book.author,
      price: book.price,
      image: book.image,
      stock: book.stock ?? 0,
      isDeleted: Boolean(book.isDeleted),
    };
  }
);

// Remove item from wishlist via API
export const removeWishlistItem = createAsyncThunk(
  "wishlist/removeWishlistItem",
  async ({ wishlistEntryId, bookId, userId }) => {
    const targetBookId = String(bookId);
    try {
      if (wishlistEntryId) {
        try {
          await axiosClient.delete(`/wishlists/${wishlistEntryId}`);
          return targetBookId;
        } catch (_err) {
          // Fallback to query
        }
      }
      const res = await axiosClient.get("/wishlists");
      const list = res.data || [];
      const match = list.find(
        (item) =>
          String(item.bookId || item.id) === targetBookId &&
          (!userId || String(item.userId) === String(userId))
      );
      if (match?.id) {
        await axiosClient.delete(`/wishlists/${match.id}`);
      }
      return targetBookId;
    } catch (error) {
      console.warn("Backend removeWishlistItem warning:", error);
      return targetBookId;
    }
  }
);

const initialState = {
  items: [],
  loading: false,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.items = [];
    },
    removeFromWishlist: (state, action) => {
      const targetId = String(action.payload);
      state.items = state.items.filter(
        (item) =>
          String(item.bookId || "") !== targetId &&
          String(item.id || "") !== targetId
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        const unique = [];
        const seen = new Set();
        (action.payload || []).forEach((item) => {
          const bId = String(item.bookId || item.id);
          if (!seen.has(bId)) {
            seen.add(bId);
            unique.push(item);
          }
        });
        state.items = unique;
        state.loading = false;
      })
      .addCase(fetchWishlist.rejected, (state) => {
        state.loading = false;
      })
      .addCase(addWishlistItem.fulfilled, (state, action) => {
        const targetBookId = String(action.payload.bookId || action.payload.id);
        const exists = state.items.some(
          (item) => String(item.bookId || item.id) === targetBookId
        );
        if (!exists) {
          state.items.push(action.payload);
        }
      })
      .addCase(removeWishlistItem.fulfilled, (state, action) => {
        if (action.payload) {
          const targetId = String(action.payload);
          state.items = state.items.filter(
            (item) =>
              String(item.bookId || "") !== targetId &&
              String(item.id || "") !== targetId
          );
        }
      })
      .addCase(removeWishlistItem.rejected, (state, action) => {
        const bookId = action.meta?.arg?.bookId;
        if (bookId) {
          const targetId = String(bookId);
          state.items = state.items.filter(
            (item) =>
              String(item.bookId || "") !== targetId &&
              String(item.id || "") !== targetId
          );
        }
      });
  },
});

export const { clearWishlist, removeFromWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;

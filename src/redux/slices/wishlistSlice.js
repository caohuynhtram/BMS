import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";
import bookApi from "../../api/bookApi";

// Fetch wishlist from API for a user
export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (userId) => {
    const res = await axiosClient.get(`/wishlists?userId=${userId}`);
    const wishlistItems = res.data;
    // Fetch book details for each wishlist item
    const booksRes = await bookApi.getAll();
    const books = booksRes.data;
    return wishlistItems.map((item) => {
      const book = books.find((b) => String(b.id) === String(item.bookId));
      return {
        id: item.id, // wishlist entry id for deletion
        bookId: item.bookId,
        title: book?.title || "",
        author: book?.author || "",
        price: book?.price || 0,
        image: book?.image || "",
      };
    });
  }
);

// Add item to wishlist via API
export const addWishlistItem = createAsyncThunk(
  "wishlist/addWishlistItem",
  async ({ userId, book }) => {
    const res = await axiosClient.post("/wishlists", {
      userId: userId,
      bookId: book.id,
    });
    return {
      id: res.data.id,
      bookId: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      image: book.image,
    };
  }
);

// Remove item from wishlist via API
export const removeWishlistItem = createAsyncThunk(
  "wishlist/removeWishlistItem",
  async ({ wishlistEntryId, bookId }) => {
    await axiosClient.delete(`/wishlists/${wishlistEntryId}`);
    return bookId;
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchWishlist.rejected, (state) => {
        state.loading = false;
      })
      .addCase(addWishlistItem.fulfilled, (state, action) => {
        const exists = state.items.find(
          (item) => String(item.bookId) === String(action.payload.bookId)
        );
        if (!exists) {
          state.items.push(action.payload);
        }
      })
      .addCase(removeWishlistItem.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => String(item.bookId) !== String(action.payload)
        );
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;

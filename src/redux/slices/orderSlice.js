import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

export const fetchOrders = createAsyncThunk(
  "order/fetchOrders",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get(`/orders?userId=${userId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch orders");
    }
  }
);

export const fetchOrderDetail = createAsyncThunk(
  "order/fetchOrderDetail",
  async (orderId, { rejectWithValue }) => {
    try {
      const [orderRes, itemsRes] = await Promise.all([
        axiosClient.get(`/orders/${orderId}`),
        axiosClient.get(`/orderItems?orderId=${orderId}`),
      ]);
      return { ...orderRes.data, items: itemsRes.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch order");
    }
  }
);

export const createOrder = createAsyncThunk(
  "order/createOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const orderRes = await axiosClient.post("/orders", {
        userId: Number(orderData.userId),
        status: "Pending",
        totalPrice: orderData.totalPrice,
        voucherId: orderData.voucherId || null,
        createdAt: new Date().toISOString().split("T")[0],
      });

      const orderItemPromises = orderData.items.map((item) =>
        axiosClient.post("/orderItems", {
          orderId: orderRes.data.id,
          bookId: item.bookId,
          quantity: item.quantity,
          price: item.price,
        })
      );
      await Promise.all(orderItemPromises);

      return orderRes.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to create order");
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "order/cancelOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/orders/${orderId}`, {
        status: "Cancelled",
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to cancel order");
    }
  }
);

// User confirms receipt (Shipping → Delivered)
export const confirmReceipt = createAsyncThunk(
  "order/confirmReceipt",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/orders/${orderId}`, {
        status: "Delivered",
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to confirm receipt"
      );
    }
  }
);

// User requests return (Delivered → Returned)
export const returnOrder = createAsyncThunk(
  "order/returnOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/orders/${orderId}`, {
        status: "Returned",
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to return order");
    }
  }
);

// Admin updates order status
export const updateOrderStatus = createAsyncThunk(
  "order/updateOrderStatus",
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/orders/${orderId}`, { status });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to update order status"
      );
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

const updateOrderInState = (state, updatedOrder) => {
  const idx = state.orders.findIndex(
    (o) => String(o.id) === String(updatedOrder.id)
  );
  if (idx !== -1) state.orders[idx] = updatedOrder;
  if (String(state.currentOrder?.id) === String(updatedOrder.id)) {
    state.currentOrder = { ...state.currentOrder, ...updatedOrder };
  }
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrderDetail.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orders.push(action.payload);
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        updateOrderInState(state, action.payload);
      })
      .addCase(confirmReceipt.fulfilled, (state, action) => {
        updateOrderInState(state, action.payload);
      })
      .addCase(returnOrder.fulfilled, (state, action) => {
        updateOrderInState(state, action.payload);
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        updateOrderInState(state, action.payload);
      });
  },
});

export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;

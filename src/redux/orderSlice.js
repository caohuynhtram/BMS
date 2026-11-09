import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../api/axiosClient";
import orderApi from "../api/orderApi";
import { getLocalDateString } from "../utils/helpers";
import { isVoucherExpired } from "../utils/cartUtils";

// Lấy danh sách đơn hàng theo userId
export const fetchOrders = createAsyncThunk(
  "order/fetchOrders",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await orderApi.getByUser(userId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Unable to load orders list");
    }
  }
);

// Lấy chi tiết 1 đơn hàng kèm items
export const fetchOrderDetail = createAsyncThunk(
  "order/fetchOrderDetail",
  async (orderId, { rejectWithValue }) => {
    try {
      const [orderRes, itemsRes] = await Promise.all([
        orderApi.getById(orderId),
        orderApi.getOrderItems(orderId),
      ]);
      return { ...orderRes.data, items: itemsRes.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || "Unable to load order details");
    }
  }
);

// Tạo đơn hàng mới và lưu snapshot thông tin nhận hàng cùng ngày đặt
export const createOrder = createAsyncThunk(
  "order/createOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      // 1. Tự động sinh mã đơn hàng chuẩn đẹp dạng ORD-XXXX (VD: ORD-1010, ORD-1011...)
      let nextOrderCode = "ORD-1001";
      try {
        const allOrdersRes = await axiosClient.get("/orders");
        const existingCodes = (allOrdersRes.data || [])
          .map((o) => o.orderCode || o.id)
          .map((code) => {
            const m = String(code).match(/ORD-(\d+)/i);
            return m ? parseInt(m[1], 10) : null;
          })
          .filter((n) => n !== null);
        const nextNum = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1001;
        nextOrderCode = `ORD-${nextNum}`;
      } catch (codeErr) {
        console.error("Failed to generate sequential orderCode:", codeErr);
      }

      const orderRes = await axiosClient.post("/orders", {
        orderCode: nextOrderCode,
        userId: String(orderData.userId),
        status: "Pending",
        totalPrice: Number(orderData.totalPrice),
        subtotal: Number(orderData.subtotal),
        discountAmount: Number(orderData.discountAmount || 0),
        voucherId: orderData.voucherId ? String(orderData.voucherId) : null,
        // Lưu snapshot thông tin nhận hàng lúc đặt
        recipientName: orderData.recipientName || "",
        phone: orderData.phone || "",
        shippingAddress: orderData.shippingAddress || "",
        // Ngày tạo đơn theo múi giờ địa phương
        createdAt: getLocalDateString(),
      });

      const orderItemPromises = orderData.items.map((item) =>
        axiosClient.post("/orderItems", {
          orderId: orderRes.data.id,
          bookId: String(item.bookId),
          title: item.title,
          image: item.image,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })
      );
      await Promise.all(orderItemPromises);

      // Trừ stock sau khi đặt hàng thành công
      for (const item of orderData.items) {
        try {
          const bookRes = await axiosClient.get(`/books/${item.bookId}`);
          if (bookRes.data) {
            const currentStock = Number(bookRes.data.stock) || 0;
            const newStock = Math.max(0, currentStock - Number(item.quantity));
            const updatePayload = { stock: newStock };
            if (newStock === 0) {
              updatePayload.status = "Out of Stock";
            }
            await axiosClient.patch(`/books/${item.bookId}`, updatePayload);
          }
        } catch (stockErr) {
          console.error(`Failed to update stock for book ${item.bookId}:`, stockErr);
        }
      }

      // Tăng số lần sử dụng voucher
      if (orderData.voucherId) {
        try {
          const vRes = await axiosClient.get(`/vouchers/${orderData.voucherId}`);
          if (vRes.data) {
            const newUsed = Number(vRes.data.used || 0) + 1;
            const patchPayload = { used: newUsed };
            if (vRes.data.usageLimit && newUsed >= Number(vRes.data.usageLimit)) {
              patchPayload.status = "Expired";
            }
            await axiosClient.patch(`/vouchers/${orderData.voucherId}`, patchPayload);
          }
        } catch (vErr) {
          console.error("Failed to increment voucher used count:", vErr);
        }
      }

      return orderRes.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Order placement failed. Please try again later.");
    }
  }
);

// Hủy đơn hàng — hoàn lại stock và voucher
export const cancelOrder = createAsyncThunk(
  "order/cancelOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const orderRes = await axiosClient.get(`/orders/${orderId}`);
      if (orderRes.data?.status !== "Pending") {
        return rejectWithValue("The order has been confirmed or is being processed and cannot be cancelled.");
      }
      const voucherId = orderRes.data?.voucherId;

      const res = await axiosClient.patch(`/orders/${orderId}`, {
        status: "Cancelled",
      });

      if (voucherId) {
        try {
          const vRes = await axiosClient.get(`/vouchers/${voucherId}`);
          if (vRes.data) {
            const currentUsed = Number(vRes.data.used || 0);
            const newUsed = Math.max(0, currentUsed - 1);
            const patchPayload = { used: newUsed };
            if (
              vRes.data.status === "Expired" &&
              !isVoucherExpired(vRes.data.expirationDate) &&
              newUsed < Number(vRes.data.usageLimit || 9999)
            ) {
              patchPayload.status = "Active";
            }
            await axiosClient.patch(`/vouchers/${voucherId}`, patchPayload);
          }
        } catch (vErr) {
          console.error("Failed to restore voucher usage on cancel:", vErr);
        }
      }

      try {
        const itemsRes = await orderApi.getOrderItems(orderId);
        for (const item of itemsRes.data) {
          const bookRes = await axiosClient.get(`/books/${item.bookId}`);
          if (bookRes.data) {
            const currentStock = Number(bookRes.data.stock) || 0;
            const newStock = currentStock + Number(item.quantity);
            const updatePayload = { stock: newStock };
            if (bookRes.data.status === "Out of Stock" || (currentStock === 0 && newStock > 0)) {
              updatePayload.status = "Active";
            }
            await axiosClient.patch(`/books/${item.bookId}`, updatePayload);
          }
        }
      } catch (stockErr) {
        console.error("Failed to restore stock on cancel:", stockErr);
      }

      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Unable to cancel order at this time.");
    }
  }
);

// Xác nhận đã nhận hàng
export const confirmReceipt = createAsyncThunk(
  "order/confirmReceipt",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/orders/${orderId}`, {
        status: "Delivered",
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to confirm delivery receipt.");
    }
  }
);

// Yêu cầu trả hàng (khách hàng gửi yêu cầu xét duyệt)
export const returnOrder = createAsyncThunk(
  "order/returnOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const currentOrderRes = await axiosClient.get(`/orders/${orderId}`);
      if (currentOrderRes.data?.status !== "Delivered") {
        return rejectWithValue("Only successfully delivered orders can request a return.");
      }

      const res = await axiosClient.patch(`/orders/${orderId}`, {
        status: "Return Requested",
      });

      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to submit return request.");
    }
  }
);

// Admin cập nhật trạng thái đơn hàng (ràng buộc không thể chuyển Delivered trực tiếp sang Returned)
export const updateOrderStatus = createAsyncThunk(
  "order/updateOrderStatus",
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const currentOrderRes = await axiosClient.get(`/orders/${orderId}`);
      const prevStatus = currentOrderRes.data?.status;

      if (prevStatus === "Delivered" && status === "Returned") {
        return rejectWithValue("Cannot change directly to Returned status. Customer must submit a return request first.");
      }

      const res = await axiosClient.patch(`/orders/${orderId}`, { status });

      if (
        (status === "Cancelled" || status === "Returned") &&
        prevStatus !== "Cancelled" &&
        prevStatus !== "Returned"
      ) {
        const itemsRes = await orderApi.getOrderItems(orderId);
        for (const item of itemsRes.data) {
          const bookRes = await axiosClient.get(`/books/${item.bookId}`);
          if (bookRes.data) {
            const currentStock = Number(bookRes.data.stock) || 0;
            const newStock = currentStock + Number(item.quantity);
            const updatePayload = { stock: newStock };
            if (bookRes.data.status === "Out of Stock" || (currentStock === 0 && newStock > 0)) {
              updatePayload.status = "Active";
            }
            await axiosClient.patch(`/books/${item.bookId}`, updatePayload);
          }
        }

        if (status === "Cancelled" && currentOrderRes.data?.voucherId) {
          try {
            const vRes = await axiosClient.get(`/vouchers/${currentOrderRes.data.voucherId}`);
            if (vRes.data) {
              const currentUsed = Number(vRes.data.used || 0);
              const newUsed = Math.max(0, currentUsed - 1);
              const patchPayload = { used: newUsed };
              if (
                vRes.data.status === "Expired" &&
                !isVoucherExpired(vRes.data.expirationDate) &&
                newUsed < Number(vRes.data.usageLimit || 9999)
              ) {
                patchPayload.status = "Active";
              }
              await axiosClient.patch(`/vouchers/${currentOrderRes.data.voucherId}`, patchPayload);
            }
          } catch (vErr) {
            console.error("Failed to restore voucher on admin cancel:", vErr);
          }
        }
      } else if (
        (prevStatus === "Cancelled" || prevStatus === "Returned") &&
        status !== "Cancelled" &&
        status !== "Returned"
      ) {
        const itemsRes = await orderApi.getOrderItems(orderId);
        for (const item of itemsRes.data) {
          const bookRes = await axiosClient.get(`/books/${item.bookId}`);
          if (bookRes.data) {
            const currentStock = Number(bookRes.data.stock) || 0;
            await axiosClient.patch(`/books/${item.bookId}`, {
              stock: Math.max(0, currentStock - Number(item.quantity)),
            });
          }
        }
      }

      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to update order status."
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
    clearOrders: (state) => {
      state.orders = [];
      state.currentOrder = null;
      state.error = null;
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

export const { clearCurrentOrder, clearOrders } = orderSlice.actions;
export default orderSlice.reducer;


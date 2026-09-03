import api from "./api";

// Admin API calls — expects these backend routes to exist:
// GET /admin/summary
// GET /admin/books
// GET /admin/orders
// GET /admin/lending

export async function fetchAdminSummary() {
  const res = await api.get("/admin/summary");
  return res.data; // flat object, no wrapper key — use as-is
}

export async function fetchAdminBooks() {
  const res = await api.get("/admin/books");
  return res.data.books; // backend returns { books: [...] }
}

export async function fetchAdminOrders() {
  const res = await api.get("/admin/orders");
  return res.data.orders; // backend returns { orders: [...] }
}

export async function fetchAdminLending() {
  const res = await api.get("/admin/lending");
  return res.data.lending_requests; // backend returns { lending_requests: [...] }
}

export async function approveLending(requestId) {
  const res = await api.post(`/admin/lending/${requestId}/approve`);
  return res.data.lending_request;
}

export async function rejectLending(requestId) {
  const res = await api.post(`/admin/lending/${requestId}/reject`);
  return res.data.lending_request;
}

export async function confirmLendingReturn(requestId) {
  const res = await api.post(`/admin/lending/${requestId}/confirm-return`);
  return res.data.lending_request;
}

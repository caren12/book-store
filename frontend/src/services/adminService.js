import api from "./api";

// Admin API calls — expects these backend routes to exist:
// GET /admin/summary
// GET /admin/books
// GET /admin/orders
// GET /admin/lending

export async function fetchAdminSummary() {
  const res = await api.get("/admin/summary");
  return res.data;
}

export async function fetchAdminBooks() {
  const res = await api.get("/admin/books");
  return res.data;
}

export async function fetchAdminOrders() {
  const res = await api.get("/admin/orders");
  return res.data;
}

export async function fetchAdminLending() {
  const res = await api.get("/admin/lending");
  return res.data;
}
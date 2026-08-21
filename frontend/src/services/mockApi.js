// In-memory mock backend used automatically when no real API server
// responds (see the fallback logic in ./api.js). This lets the frontend
// run and be demoed/styled with realistic data even with zero backend setup.
// Not persisted across page reloads — it's a dev convenience only.

let idCounter = 1000;
const nextId = () => idCounter++;

const GENRES = ["Fiction", "Fantasy", "Science Fiction", "Mystery", "Romance", "Non-Fiction", "Biography", "Self-Help", "History", "Thriller"];

function makeBook(i) {
  const genre = GENRES[i % GENRES.length];
  return {
    id: i + 1,
    title: `Sample Book ${i + 1}`,
    author: `Author ${String.fromCharCode(65 + (i % 26))}`,
    genre,
    description: `A placeholder description for Sample Book ${i + 1}, a ${genre.toLowerCase()} title used for frontend preview purposes.`,
    cover_url: `https://picsum.photos/seed/booked${i + 1}/300/450`,
    price: Math.round((9.99 + (i % 20) * 1.5) * 100) / 100,
    is_in_store: i % 5 !== 0,
    is_in_library: i % 3 !== 0,
    total_copies: (i % 3) + 1,
    available_copies: i % 4 === 0 ? 0 : (i % 3) + 1,
    date_uploaded: new Date(Date.now() - i * 86400000).toISOString(),
  };
}

const state = {
  books: Array.from({ length: 24 }, (_, i) => makeBook(i)),
  users: [
    { id: 1, name: "Admin", email: "admin@booked.com", role: "admin", password: "admin123" },
    { id: 2, name: "Demo Reader", email: "reader@booked.com", role: "user", password: "reader123" },
  ],
  cart: [],
  orders: [],
  lending: [],
  currentUserId: null,
};

function findBook(id) {
  return state.books.find((b) => b.id === Number(id));
}

function currentUser() {
  return state.users.find((u) => u.id === state.currentUserId);
}

function userDict(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, created_at: new Date().toISOString() };
}

function orderDict(order) {
  return {
    ...order,
    items: order.items.map((it) => ({ ...it, book: findBook(it.book_id) })),
  };
}

function lendingDict(req) {
  return { ...req, book: findBook(req.book_id) };
}

// Very small router: matches method + path pattern against the mock state.
export function handleMockRequest(config) {
  const method = (config.method || "get").toLowerCase();
  const url = (config.url || "").replace(/^\/api/, "").replace(/^\//, "");
  const parts = url.split("?")[0].split("/").filter(Boolean);
  const params = config.params || {};
  const data = config.data ? JSON.parse(config.data) : {};

  // --- auth ---
  if (parts[0] === "auth" && parts[1] === "register" && method === "post") {
    if (state.users.some((u) => u.email === data.email)) {
      return errorResponse(409, "An account with this email already exists");
    }
    const user = { id: nextId(), name: data.name, email: data.email, role: "user", password: data.password };
    state.users.push(user);
    state.currentUserId = user.id;
    return okResponse(201, { user: userDict(user), access_token: `mock-token-${user.id}` });
  }

  if (parts[0] === "auth" && parts[1] === "login" && method === "post") {
    const user = state.users.find((u) => u.email === data.email && u.password === data.password);
    if (!user) return errorResponse(401, "Invalid email or password");
    state.currentUserId = user.id;
    return okResponse(200, { user: userDict(user), access_token: `mock-token-${user.id}` });
  }

  if (parts[0] === "auth" && parts[1] === "me" && method === "get") {
    const user = currentUser();
    if (!user) return errorResponse(401, "Not authenticated");
    return okResponse(200, { user: userDict(user) });
  }

  // --- books ---
  if (parts[0] === "books" && parts[1] === "genres" && method === "get") {
    return okResponse(200, { genres: GENRES });
  }

  if (parts[0] === "books" && parts.length === 1 && method === "get") {
    let results = [...state.books];
    if (params.q) {
      const q = params.q.toLowerCase();
      results = results.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.genre.toLowerCase().includes(q));
    }
    if (params.genre) results = results.filter((b) => b.genre.toLowerCase() === params.genre.toLowerCase());
    if (params.section === "store") results = results.filter((b) => b.is_in_store);
    if (params.section === "library") results = results.filter((b) => b.is_in_library);
    if (params.min_price) results = results.filter((b) => b.price >= Number(params.min_price));
    if (params.max_price) results = results.filter((b) => b.price <= Number(params.max_price));
    if (params.sort === "price_asc") results.sort((a, b) => a.price - b.price);
    else if (params.sort === "price_desc") results.sort((a, b) => b.price - a.price);
    return okResponse(200, { books: results });
  }

  if (parts[0] === "books" && parts.length === 2 && method === "get") {
    const book = findBook(parts[1]);
    if (!book) return errorResponse(404, "Book not found");
    return okResponse(200, { book });
  }

  if (parts[0] === "books" && parts.length === 1 && method === "post") {
    const book = makeBook(state.books.length);
    Object.assign(book, data, { id: nextId(), available_copies: data.total_copies || 0 });
    state.books.push(book);
    return okResponse(201, { book });
  }

  if (parts[0] === "books" && parts.length === 2 && method === "put") {
    const book = findBook(parts[1]);
    if (!book) return errorResponse(404, "Book not found");
    Object.assign(book, data);
    return okResponse(200, { book });
  }

  if (parts[0] === "books" && parts.length === 2 && method === "delete") {
    state.books = state.books.filter((b) => b.id !== Number(parts[1]));
    return okResponse(200, { message: "Book deleted" });
  }

  // --- cart ---
  if (parts[0] === "cart" && parts.length === 1 && method === "get") {
    let items = state.cart.filter((c) => c.user_id === state.currentUserId);
    if (params.cart_type) items = items.filter((c) => c.cart_type === params.cart_type);
    return okResponse(200, { items: items.map((c) => ({ ...c, book: findBook(c.book_id) })) });
  }

  if (parts[0] === "cart" && parts.length === 1 && method === "post") {
    const existing = state.cart.find((c) => c.user_id === state.currentUserId && c.book_id === data.book_id && c.cart_type === data.cart_type);
    if (existing) {
      existing.quantity += data.quantity || 1;
      return okResponse(201, { item: { ...existing, book: findBook(existing.book_id) } });
    }
    const item = { id: nextId(), user_id: state.currentUserId, book_id: data.book_id, cart_type: data.cart_type, quantity: data.quantity || 1 };
    state.cart.push(item);
    return okResponse(201, { item: { ...item, book: findBook(item.book_id) } });
  }

  if (parts[0] === "cart" && parts.length === 2 && method === "delete") {
    state.cart = state.cart.filter((c) => c.id !== Number(parts[1]));
    return okResponse(200, { message: "Item removed" });
  }

  // --- orders (purchase) ---
  if (parts[0] === "orders" && parts[1] === "checkout" && method === "post") {
    const items = state.cart.filter((c) => c.user_id === state.currentUserId && c.cart_type === "purchase");
    if (items.length === 0) return errorResponse(400, "Your purchase cart is empty");
    const total = items.reduce((sum, c) => sum + findBook(c.book_id).price * c.quantity, 0);
    const order = {
      id: nextId(), user_id: state.currentUserId, status: "pending", payment_status: "unpaid",
      total_amount: total, created_at: new Date().toISOString(),
      items: items.map((c) => ({ id: nextId(), book_id: c.book_id, quantity: c.quantity, unit_price: findBook(c.book_id).price })),
    };
    state.orders.push(order);
    state.cart = state.cart.filter((c) => !(c.user_id === state.currentUserId && c.cart_type === "purchase"));
    return okResponse(201, { order: orderDict(order) });
  }

  if (parts[0] === "orders" && parts.length === 1 && method === "get") {
    const orders = state.orders.filter((o) => o.user_id === state.currentUserId);
    return okResponse(200, { orders: orders.map(orderDict) });
  }

  if (parts[0] === "orders" && parts[2] === "pay" && method === "post") {
    const order = state.orders.find((o) => o.id === Number(parts[1]));
    if (!order) return errorResponse(404, "Order not found");
    if (order.status !== "approved") return errorResponse(400, "Order must be approved before payment");
    order.payment_status = "paid";
    return okResponse(200, { order: orderDict(order) });
  }

  // --- lending ---
  if (parts[0] === "lending" && parts[1] === "checkout" && method === "post") {
    const items = state.cart.filter((c) => c.user_id === state.currentUserId && c.cart_type === "lending");
    if (items.length === 0) return errorResponse(400, "Your lending cart is empty");
    const created = items.map((c) => ({
      id: nextId(), user_id: state.currentUserId, book_id: c.book_id, status: "pending",
      requested_at: new Date().toISOString(), approved_at: null, due_date: null, returned_at: null,
    }));
    state.lending.push(...created);
    state.cart = state.cart.filter((c) => !(c.user_id === state.currentUserId && c.cart_type === "lending"));
    return okResponse(201, { lending_requests: created.map(lendingDict) });
  }

  if (parts[0] === "lending" && parts.length === 1 && method === "get") {
    const reqs = state.lending.filter((r) => r.user_id === state.currentUserId);
    return okResponse(200, { lending_requests: reqs.map(lendingDict) });
  }

  if (parts[0] === "lending" && parts[2] === "return" && method === "post") {
    const req = state.lending.find((r) => r.id === Number(parts[1]));
    if (!req) return errorResponse(404, "Lending request not found");
    req.status = "return_requested";
    return okResponse(200, { lending_request: lendingDict(req) });
  }

  // --- admin ---
  if (parts[0] === "admin" && parts[1] === "books" && method === "get") {
    return okResponse(200, { books: state.books });
  }
  if (parts[0] === "admin" && parts[1] === "orders" && parts.length === 2 && method === "get") {
    return okResponse(200, { orders: state.orders.map(orderDict) });
  }
  if (parts[0] === "admin" && parts[1] === "orders" && parts[3] === "approve" && method === "post") {
    const order = state.orders.find((o) => o.id === Number(parts[2]));
    if (order) order.status = "approved";
    return okResponse(200, { order: orderDict(order) });
  }
  if (parts[0] === "admin" && parts[1] === "orders" && parts[3] === "reject" && method === "post") {
    const order = state.orders.find((o) => o.id === Number(parts[2]));
    if (order) order.status = "rejected";
    return okResponse(200, { order: orderDict(order) });
  }
  if (parts[0] === "admin" && parts[1] === "lending" && parts.length === 2 && method === "get") {
    return okResponse(200, { lending_requests: state.lending.map(lendingDict) });
  }
  if (parts[0] === "admin" && parts[1] === "lending" && parts[3] === "approve" && method === "post") {
    const req = state.lending.find((r) => r.id === Number(parts[2]));
    if (req) {
      req.status = "approved";
      req.approved_at = new Date().toISOString();
      req.due_date = new Date(Date.now() + 14 * 86400000).toISOString();
    }
    return okResponse(200, { lending_request: lendingDict(req) });
  }
  if (parts[0] === "admin" && parts[1] === "lending" && parts[3] === "reject" && method === "post") {
    const req = state.lending.find((r) => r.id === Number(parts[2]));
    if (req) req.status = "rejected";
    return okResponse(200, { lending_request: lendingDict(req) });
  }
  if (parts[0] === "admin" && parts[1] === "lending" && parts[3] === "confirm-return" && method === "post") {
    const req = state.lending.find((r) => r.id === Number(parts[2]));
    if (req) {
      req.status = "returned";
      req.returned_at = new Date().toISOString();
    }
    return okResponse(200, { lending_request: lendingDict(req) });
  }
  if (parts[0] === "admin" && parts[1] === "users" && method === "get") {
    return okResponse(200, { users: state.users.map(userDict) });
  }

  if (parts[0] === "health") {
    return okResponse(200, { status: "ok (mock)" });
  }

  return errorResponse(404, "Mock endpoint not implemented: " + method.toUpperCase() + " /" + url);
}

function okResponse(status, data) {
  return Promise.resolve({ data, status, statusText: "OK (mock)", headers: {}, config: {} });
}

function errorResponse(status, message) {
  const error = new Error(message);
  error.response = { data: { error: message }, status, statusText: "Error (mock)", headers: {}, config: {} };
  return Promise.reject(error);
}

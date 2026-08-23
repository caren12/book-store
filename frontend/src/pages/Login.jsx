import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, clearAuthError } from "../features/auth/authSlice";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const res = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(res)) navigate("/");
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display text-3xl mb-6">Welcome back</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wide text-ink/60 mb-1">Email</label>
          <input type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-ink/30 rounded-sm px-3 py-2 bg-parchment" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-ink/60 mb-1">Password</label>
          <input type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-ink/30 rounded-sm px-3 py-2 bg-parchment" />
        </div>
        {error && <p className="text-sm text-burgundy">{error}</p>}
        <button type="submit" disabled={status === "loading"}
          className="w-full bg-ink text-paper py-2.5 rounded-sm font-medium hover:bg-brass transition">
          {status === "loading" ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p className="text-sm text-ink/60 mt-4">
        New to Booked? <Link to="/register" className="text-brass underline">Create an account</Link>
      </p>
    </div>
  );
}

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, clearAuthError } from "../features/auth/authSlice";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const res = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(res)) navigate("/");
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display text-3xl mb-6">Join Booked</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wide text-ink/60 mb-1">Name</label>
          <input required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-ink/30 rounded-sm px-3 py-2 bg-parchment" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-ink/60 mb-1">Email</label>
          <input type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-ink/30 rounded-sm px-3 py-2 bg-parchment" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-ink/60 mb-1">Password</label>
          <input type="password" required minLength={6} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-ink/30 rounded-sm px-3 py-2 bg-parchment" />
        </div>
        {error && <p className="text-sm text-burgundy">{error}</p>}
        <button type="submit" disabled={status === "loading"}
          className="w-full bg-ink text-paper py-2.5 rounded-sm font-medium hover:bg-brass transition">
          {status === "loading" ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="text-sm text-ink/60 mt-4">
        Already have an account? <Link to="/login" className="text-brass underline">Log in</Link>
      </p>
    </div>
  );
}
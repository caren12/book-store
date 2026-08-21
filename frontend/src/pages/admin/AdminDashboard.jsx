import { Link } from "react-router-dom";

const TILES = [
  { to: "/admin/books", title: "Books", desc: "Add, edit, or remove titles from the shop and library." },
  { to: "/admin/orders", title: "Purchase Orders", desc: "Approve or reject pending purchase orders." },
  { to: "/admin/lending", title: "Lending Requests", desc: "Approve, reject, and confirm returns." },
];

export default function AdminDashboard() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl mb-2">Admin Dashboard</h1>
      <p className="text-ink/60 mb-8">Overlord tools for running the store and library.</p>
      <div className="grid sm:grid-cols-3 gap-5">
        {TILES.map((t) => (
          <Link key={t.to} to={t.to} className="block bg-parchment border border-ink/15 rounded-sm p-5 hover:shadow-lg transition">
            <h2 className="font-display text-xl mb-1">{t.title}</h2>
            <p className="text-sm text-ink/60">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminSummary } from "../../services/adminService";

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchAdminSummary()
      .then((data) => {
        if (isMounted) {
          setSummary(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error || "Could not load dashboard summary");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-ink/50">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-800">{error}</div>;
  }

  const cards = [
    { label: "Books", value: summary.total_books, to: "/admin/books" },
    { label: "Orders", value: summary.total_orders, to: "/admin/orders" },
    { label: "Pending Orders", value: summary.pending_orders, to: "/admin/orders" },
    { label: "Active Loans", value: summary.active_loans, to: "/admin/lending" },
    { label: "Overdue Loans", value: summary.overdue_loans, to: "/admin/lending" },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="font-display text-2xl text-ink mb-1">Admin Dashboard</h1>
      <p className="text-sm text-ink/50 mb-6">Overview of books, orders, and lending activity.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="bg-parchment border border-ink/20 rounded-sm p-4 hover:shadow-md transition-shadow"
          >
            <p className="text-3xl font-display text-ink">{card.value}</p>
            <p className="text-xs uppercase tracking-widest text-ink/50 mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      <nav className="mt-8 flex gap-4 text-sm">
        <Link to="/admin/books" className="text-blue-900 underline">Manage Books</Link>
        <Link to="/admin/orders" className="text-blue-900 underline">Manage Orders</Link>
        <Link to="/admin/lending" className="text-blue-900 underline">Manage Lending</Link>
      </nav>
    </div>
  );
}
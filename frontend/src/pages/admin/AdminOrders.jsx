import { useEffect, useState } from "react";
import { fetchAdminOrders } from "../../services/adminService";

const STATUS_STYLES = {
  pending: "border-brass text-brass",
  completed: "border-forest text-forest",
  cancelled: "border-red-800 text-red-800",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchAdminOrders()
      .then((data) => {
        if (isMounted) {
          setOrders(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error || "Could not load orders");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-ink/50">Loading orders...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-800">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="font-display text-2xl text-ink mb-1">Orders</h1>
      <p className="text-sm text-ink/50 mb-6">
        {orders.length} order{orders.length !== 1 ? "s" : ""} placed. Purchases are processed automatically once paid —
        no admin approval needed.
      </p>

      <div className="overflow-x-auto border border-ink/20 rounded-sm">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-widest text-ink/50">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-ink/10">
                <td className="p-3 font-medium text-ink">{order.id}</td>
                <td className="p-3 text-ink/70">{order.user_email}</td>
                <td className="p-3 text-ink/70">{order.items}</td>
                <td className="p-3 text-ink/70">${Number(order.total).toFixed(2)}</td>
                <td className="p-3">
                  <span
                    className={`card-stamp ${STATUS_STYLES[order.status] || "border-ink/40 text-ink/70"}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="p-3 text-ink/70">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  const load = async () => {
    const res = await api.get("/admin/orders");
    setOrders(res.data.orders);
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id, action) => {
    await api.post(`/admin/orders/${id}/${action}`);
    load();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl mb-6">Purchase Orders</h1>
      <div className="space-y-3">
        {orders.length === 0 && <p className="text-ink/50 italic">No orders yet.</p>}
        {orders.map((o) => (
          <div key={o.id} className="bg-parchment border border-ink/15 rounded-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">Order #{o.id} · ${o.total_amount.toFixed(2)}</p>
              <span className="card-stamp border-ink/30 text-ink/70">{o.status} / {o.payment_status}</span>
            </div>
            <ul className="text-sm text-ink/70 mb-3 list-disc list-inside">
              {o.items.map((i) => <li key={i.id}>{i.book?.title} × {i.quantity}</li>)}
            </ul>
            {o.status === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => act(o.id, "approve")} className="bg-forest text-paper px-3 py-1.5 rounded-sm text-sm font-medium">Approve</button>
                <button onClick={() => act(o.id, "reject")} className="bg-burgundy text-paper px-3 py-1.5 rounded-sm text-sm font-medium">Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyOrders, fetchMyLending, payOrder, requestReturn } from "../features/orders/ordersSlice";

const STATUS_STYLES = {
  pending: "border-brass text-brass",
  approved: "border-forest text-forest",
  rejected: "border-burgundy text-burgundy",
  returned: "border-ink/40 text-ink/60",
  return_requested: "border-brass text-brass",
};

function StatusStamp({ status }) {
  return (
    <span className={`card-stamp ${STATUS_STYLES[status] || "border-ink/30 text-ink/60"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function MyActivity() {
  const dispatch = useDispatch();
  const { purchaseOrders, lendingRequests } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
    dispatch(fetchMyLending());
  }, [dispatch]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl mb-8">My Activity</h1>

      <section className="mb-12">
        <h2 className="font-display text-2xl mb-4">Purchases</h2>
        {purchaseOrders.length === 0 && <p className="text-ink/50 italic">No purchase orders yet.</p>}
        <div className="space-y-3">
          {purchaseOrders.map((order) => (
            <div key={order.id} className="bg-parchment border border-ink/15 rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Order #{order.id} · ${order.total_amount.toFixed(2)}</p>
                <div className="flex gap-2">
                  <StatusStamp status={order.status} />
                  <StatusStamp status={order.payment_status} />
                </div>
              </div>
              <ul className="text-sm text-ink/70 mb-3 list-disc list-inside">
                {order.items.map((item) => (
                  <li key={item.id}>{item.book?.title} × {item.quantity}</li>
                ))}
              </ul>
              {order.status === "approved" && order.payment_status === "unpaid" && (
                <button
                  onClick={() => dispatch(payOrder(order.id))}
                  className="bg-forest text-paper px-4 py-1.5 rounded-sm text-sm font-medium hover:opacity-90"
                >
                  Pay now
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Lending</h2>
        {lendingRequests.length === 0 && <p className="text-ink/50 italic">No lending requests yet.</p>}
        <div className="space-y-3">
          {lendingRequests.map((req) => (
            <div key={req.id} className="bg-parchment border border-ink/15 rounded-sm p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{req.book?.title}</p>
                <p className="text-sm text-ink/60">
                  {req.due_date ? `Due ${new Date(req.due_date).toLocaleDateString()}` : "Awaiting approval"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusStamp status={req.status} />
                {req.status === "approved" && (
                  <button
                    onClick={() => dispatch(requestReturn(req.id))}
                    className="text-sm border border-ink px-3 py-1 rounded-sm hover:bg-ink hover:text-paper transition"
                  >
                    Initiate return
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

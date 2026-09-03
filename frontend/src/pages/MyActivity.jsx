import { useEffect, useState } from "react";
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

function CardPaymentModal({ order, onClose, onSubmit, submitting, error }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ cardNumber: cardNumber.replace(/\s/g, ""), expiry, cvv });
  }

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 px-4">
      <div className="bg-paper max-w-sm w-full rounded-sm border border-ink/15 p-6">
        <h3 className="font-display text-xl mb-1">Pay Order #{order.id}</h3>
        <p className="text-sm text-ink/60 mb-4">
          Total: ${Number(order.total_amount).toFixed(2)} · Simulated card payment, no real charge occurs.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">
              Card Number
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={19}
              placeholder="4111 1111 1111 1111"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
              className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-forest"
            />
            <p className="text-xs text-ink/40 mt-1">
              Ending in "0000" simulates a declined card. Any other 16 digits succeed.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">
                Expiry
              </label>
              <input
                type="text"
                placeholder="12/28"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                required
                className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-forest"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">
                CVV
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                required
                className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          {error && <p className="text-sm text-burgundy">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-forest text-paper px-4 py-2 rounded-sm text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Pay"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-sm text-sm border border-ink/20 hover:bg-ink/5"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyActivity() {
  const dispatch = useDispatch();
  const { purchaseOrders, lendingRequests } = useSelector((state) => state.orders);
  const [payingOrder, setPayingOrder] = useState(null); // the order object currently in the modal
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState(null);

  useEffect(() => {
    dispatch(fetchMyOrders());
    dispatch(fetchMyLending());
  }, [dispatch]);

  async function handlePaySubmit({ cardNumber, expiry, cvv }) {
    setSubmitting(true);
    setPayError(null);
    const result = await dispatch(payOrder({ orderId: payingOrder.id, cardNumber, expiry, cvv }));
    setSubmitting(false);
    if (payOrder.fulfilled.match(result)) {
      setPayingOrder(null);
    } else {
      setPayError(result.payload || "Payment failed");
    }
  }

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
                  <StatusStamp status={order.payment_status} />
                </div>
              </div>
              <ul className="text-sm text-ink/70 mb-3 list-disc list-inside">
                {order.items.map((item) => (
                  <li key={item.id}>{item.book?.title} × {item.quantity}</li>
                ))}
              </ul>
              {order.payment_status === "unpaid" && (
                <button
                  onClick={() => {
                    setPayError(null);
                    setPayingOrder(order);
                  }}
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

      {payingOrder && (
        <CardPaymentModal
          order={payingOrder}
          onClose={() => setPayingOrder(null)}
          onSubmit={handlePaySubmit}
          submitting={submitting}
          error={payError}
        />
      )}
    </div>
  );
}
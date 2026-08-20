import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchCart, removeFromCart, selectPurchaseCart, selectLendingCart } from "../features/cart/cartSlice";
import { checkoutPurchase, checkoutLending } from "../features/orders/ordersSlice";

const ACCENTS = {
  burgundy: { text: "text-burgundy", bg: "bg-burgundy" },
  forest: { text: "text-forest", bg: "bg-forest" },
};

function CartSection({ title, items, accent, onRemove, onCheckout, checkoutLabel, emptyText, showPrice }) {
  const total = items.reduce((sum, i) => sum + (i.book?.price || 0) * i.quantity, 0);
  const cls = ACCENTS[accent];
  return (
    <div className="mb-10">
      <h2 className={`font-display text-2xl mb-4 ${cls.text}`}>{title}</h2>
      {items.length === 0 ? (
        <p className="text-ink/50 italic">{emptyText}</p>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-parchment border border-ink/15 rounded-sm p-3">
                <div>
                  <p className="font-medium">{item.book?.title}</p>
                  <p className="text-sm text-ink/60">{item.book?.author} · Qty {item.quantity}</p>
                </div>
                <div className="flex items-center gap-4">
                  {showPrice && <span className="font-medium">${((item.book?.price || 0) * item.quantity).toFixed(2)}</span>}
                  <button onClick={() => onRemove(item.id)} className="text-sm text-burgundy underline">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            {showPrice ? <p className="font-medium">Total: ${total.toFixed(2)}</p> : <span />}
            <button onClick={onCheckout} className={`${cls.bg} text-paper px-5 py-2 rounded-sm font-medium hover:opacity-90 transition`}>
              {checkoutLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const purchaseItems = useSelector(selectPurchaseCart);
  const lendingItems = useSelector(selectLendingCart);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleCheckoutPurchase = async () => {
    const res = await dispatch(checkoutPurchase());
    if (checkoutPurchase.fulfilled.match(res)) {
      setNotice("Order placed! It now awaits admin approval before payment.");
      navigate("/my-activity");
    } else {
      setNotice(res.payload || "Checkout failed.");
    }
  };

  const handleCheckoutLending = async () => {
    const res = await dispatch(checkoutLending());
    if (checkoutLending.fulfilled.match(res)) {
      setNotice("Lending request submitted! It now awaits admin approval.");
      navigate("/my-activity");
    } else {
      setNotice(res.payload || "Lending checkout failed.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl mb-2">Your Carts</h1>
      <p className="text-ink/60 mb-8">Purchases and library loans are checked out separately.</p>
      {notice && <p className="text-sm text-forest mb-6">{notice}</p>}

      <CartSection
        title="Purchase Cart"
        items={purchaseItems}
        accent="burgundy"
        onRemove={(id) => dispatch(removeFromCart(id))}
        onCheckout={handleCheckoutPurchase}
        checkoutLabel="Checkout & place order"
        emptyText="Nothing in your purchase cart yet."
        showPrice
      />

      <CartSection
        title="Lending Cart"
        items={lendingItems}
        accent="forest"
        onRemove={(id) => dispatch(removeFromCart(id))}
        onCheckout={handleCheckoutLending}
        checkoutLabel="Submit lending request"
        emptyText="Nothing in your lending cart yet."
        showPrice={false}
      />
    </div>
  );
}

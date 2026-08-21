import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminLending() {
  const [requests, setRequests] = useState([]);

  const load = async () => {
    const res = await api.get("/admin/lending");
    setRequests(res.data.lending_requests);
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id, action) => {
    await api.post(`/admin/lending/${id}/${action}`);
    load();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl mb-6">Lending Requests</h1>
      <div className="space-y-3">
        {requests.length === 0 && <p className="text-ink/50 italic">No lending requests yet.</p>}
        {requests.map((r) => (
          <div key={r.id} className="bg-parchment border border-ink/15 rounded-sm p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{r.book?.title}</p>
              <p className="text-xs text-ink/60">
                {r.due_date ? `Due ${new Date(r.due_date).toLocaleDateString()}` : "Not yet approved"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="card-stamp border-ink/30 text-ink/70">{r.status.replace("_", " ")}</span>
              {r.status === "pending" && (
                <>
                  <button onClick={() => act(r.id, "approve")} className="bg-forest text-paper px-3 py-1.5 rounded-sm text-sm font-medium">Approve</button>
                  <button onClick={() => act(r.id, "reject")} className="bg-burgundy text-paper px-3 py-1.5 rounded-sm text-sm font-medium">Reject</button>
                </>
              )}
              {r.status === "return_requested" && (
                <button onClick={() => act(r.id, "confirm-return")} className="bg-ink text-paper px-3 py-1.5 rounded-sm text-sm font-medium">Confirm return</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
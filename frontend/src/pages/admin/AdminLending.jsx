import { useEffect, useState } from "react";
import {
  fetchAdminLending,
  approveLending,
  rejectLending,
  confirmLendingReturn,
} from "../../services/adminService";

const STATUS_STYLES = {
  pending: "border-brass text-brass",
  approved: "border-forest text-forest",
  rejected: "border-red-800 text-red-800",
  return_requested: "border-brass text-brass",
  returned: "border-ink/40 text-ink/60",
};

const STATUS_LABELS = {
  pending: "Pending",
  approved: "On Loan",
  rejected: "Rejected",
  return_requested: "Return Requested",
  returned: "Returned",
};

export default function AdminLending() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchAdminLending()
      .then((data) => {
        if (isMounted) {
          setLoans(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error || "Could not load lending records");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  async function refresh() {
    const data = await fetchAdminLending();
    setLoans(data);
  }

  async function handleApprove(requestId) {
    setActioningId(requestId);
    try {
      await approveLending(requestId);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || "Could not approve lending request");
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(requestId) {
    setActioningId(requestId);
    try {
      await rejectLending(requestId);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || "Could not reject lending request");
    } finally {
      setActioningId(null);
    }
  }

  async function handleConfirmReturn(requestId) {
    setActioningId(requestId);
    try {
      await confirmLendingReturn(requestId);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || "Could not confirm return");
    } finally {
      setActioningId(null);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-ink/50">Loading lending records...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-800">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="font-display text-2xl text-ink mb-1">Manage Lending</h1>
      <p className="text-sm text-ink/50 mb-6">
        {loans.length} loan record{loans.length !== 1 ? "s" : ""}.
      </p>

      <div className="overflow-x-auto border border-ink/20 rounded-sm">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-widest text-ink/50">
            <tr>
              <th className="p-3">Borrower</th>
              <th className="p-3">Book</th>
              <th className="p-3">Status</th>
              <th className="p-3">Due Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id} className="border-t border-ink/10">
                <td className="p-3 text-ink/70">{loan.user?.email || "—"}</td>
                <td className="p-3 font-medium text-ink">{loan.book?.title || "—"}</td>
                <td className="p-3">
                  <span
                    className={`card-stamp ${STATUS_STYLES[loan.status] || "border-ink/40 text-ink/70"}`}
                  >
                    {STATUS_LABELS[loan.status] || loan.status}
                  </span>
                </td>
                <td className="p-3 text-ink/70">
                  {loan.due_date ? new Date(loan.due_date).toLocaleDateString() : "—"}
                </td>
                <td className="p-3">
                  {loan.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(loan.id)}
                        disabled={actioningId === loan.id}
                        className="px-3 py-1 text-xs border border-forest text-forest rounded-sm hover:bg-forest hover:text-white transition-colors disabled:opacity-50"
                      >
                        {actioningId === loan.id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleReject(loan.id)}
                        disabled={actioningId === loan.id}
                        className="px-3 py-1 text-xs border border-red-800 text-red-800 rounded-sm hover:bg-red-800 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {actioningId === loan.id ? "..." : "Reject"}
                      </button>
                    </div>
                  )}
                  {loan.status === "return_requested" && (
                    <button
                      onClick={() => handleConfirmReturn(loan.id)}
                      disabled={actioningId === loan.id}
                      className="px-3 py-1 text-xs border border-forest text-forest rounded-sm hover:bg-forest hover:text-white transition-colors disabled:opacity-50"
                    >
                      {actioningId === loan.id ? "..." : "Confirm Return"}
                    </button>
                  )}
                  {loan.status !== "pending" && loan.status !== "return_requested" && (
                    <span className="text-ink/30 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
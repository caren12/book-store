import { useEffect, useState } from "react";
import { fetchAdminLending } from "../../services/adminService";

const STATUS_STYLES = {
  on_loan: "border-brass text-brass",
  returned: "border-forest text-forest",
  overdue: "border-red-800 text-red-800",
};

const STATUS_LABELS = {
  on_loan: "On Loan",
  returned: "Returned",
  overdue: "Overdue",
};

export default function AdminLending() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id} className="border-t border-ink/10">
                <td className="p-3 text-ink/70">{loan.user_email}</td>
                <td className="p-3 font-medium text-ink">{loan.book_title}</td>
                <td className="p-3">
                  <span
                    className={`card-stamp ${STATUS_STYLES[loan.status] || "border-ink/40 text-ink/70"}`}
                  >
                    {STATUS_LABELS[loan.status] || loan.status}
                  </span>
                </td>
                <td className="p-3 text-ink/70">{loan.due_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Transaction = {
  id: string;
  user_id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  reference: string | null;
  description: string | null;
  created_at: string;
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to view your transactions.");
        return;
      }

      const { data, error } = await supabase
        .from("transactions")
        .select(
          "id,user_id,type,status,amount,currency,reference,description,created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("TRANSACTIONS ERROR:", error);
        setError(error.message);
        return;
      }

      setTransactions((data ?? []) as Transaction[]);
    } catch (err) {
      console.error(err);
      setError("Unable to load transactions.");
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(amount: number, currency: string) {
    return `${currency} ${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case "COMPLETED":
        return {
          color: "#5dcc8a",
          background: "rgba(93,204,138,0.08)",
          borderColor: "rgba(93,204,138,0.2)",
        };

      case "FAILED":
      case "CANCELLED":
        return {
          color: "#ff7777",
          background: "rgba(255,80,80,0.08)",
          borderColor: "rgba(255,80,80,0.2)",
        };

      default:
        return {
          color: "#d4a017",
          background: "rgba(212,160,23,0.08)",
          borderColor: "rgba(212,160,23,0.2)",
        };
    }
  }

  function getTransactionIcon(type: string) {
    switch (type) {
      case "WITHDRAWAL":
        return "bx-up-arrow-circle";

      case "DEPOSIT":
        return "bx-down-arrow-circle";

      case "INVESTMENT":
        return "bx-trending-up";

      case "PROFIT":
        return "bx-line-chart";

      default:
        return "bx-receipt";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: "#9090a8" }}>
          Loading transaction history...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}

      <div className="mb-8">
        <p
          className="text-xs uppercase tracking-widest font-semibold mb-3"
          style={{ color: "#d4a017" }}
        >
          Wallet Activity
        </p>

        <h1 className="text-3xl font-black">
          Transaction History
        </h1>

        <p
          className="mt-2 text-sm"
          style={{ color: "#9090a8" }}
        >
          View deposits, withdrawals, investments and wallet activity.
        </p>
      </div>

      {error && (
        <div
          className="mb-6 p-4 border text-sm"
          style={{
            color: "#ff8b8b",
            background: "rgba(255,80,80,0.06)",
            borderColor: "rgba(255,80,80,0.15)",
          }}
        >
          {error}
        </div>
      )}

      {/* EMPTY */}

      {transactions.length === 0 && !error && (
        <div
          className="p-10 border text-center"
          style={{
            background: "#111118",
            borderColor: "rgba(212,160,23,0.15)",
          }}
        >
          <i
            className="bx bx-receipt text-4xl"
            style={{ color: "#d4a017" }}
          />

          <h2 className="mt-4 text-xl font-bold">
            No transactions yet
          </h2>

          <p
            className="mt-2 text-sm"
            style={{ color: "#9090a8" }}
          >
            Your deposits, withdrawals and investment activity will
            appear here.
          </p>
        </div>
      )}

      {/* TRANSACTION LIST */}

      {transactions.length > 0 && (
        <div
          className="border overflow-hidden"
          style={{
            background: "#111118",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {transactions.map((transaction) => {
            const statusStyle = getStatusStyle(
              transaction.status
            );

            const isWithdrawal =
              transaction.type === "WITHDRAWAL";

            return (
              <button
                key={transaction.id}
                type="button"
                onClick={() => setSelected(transaction)}
                className="w-full text-left p-5 border-b transition-all hover:bg-white/[0.02]"
                style={{
                  borderColor:
                    "rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center gap-4">

                  {/* ICON */}

                  <div
                    className="w-11 h-11 shrink-0 flex items-center justify-center"
                    style={{
                      background: isWithdrawal
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(212,160,23,0.08)",
                      color: isWithdrawal
                        ? "#f5f0e8"
                        : "#d4a017",
                    }}
                  >
                    <i
                      className={`bx ${getTransactionIcon(
                        transaction.type
                      )} text-xl`}
                    />
                  </div>

                  {/* INFO */}

                  <div className="flex-1 min-w-0">

                    <div className="flex flex-wrap items-center gap-2">

                      <p className="font-bold">
                        {transaction.type === "WITHDRAWAL"
                          ? "Withdrawal"
                          : transaction.type}
                      </p>

                      <span
                        className="px-2 py-1 border text-[10px] font-bold uppercase tracking-wide"
                        style={statusStyle}
                      >
                        {transaction.status}
                      </span>

                    </div>

                    <p
                      className="text-xs mt-1 truncate"
                      style={{
                        color: "#777789",
                      }}
                    >
                      {transaction.description ||
                        "Transaction activity"}
                    </p>

                    <p
                      className="text-xs mt-1"
                      style={{
                        color: "#666678",
                      }}
                    >
                      {formatDate(transaction.created_at)}
                    </p>

                  </div>

                  {/* AMOUNT */}

                  <div className="text-right shrink-0">

                    <p className="font-black">
                      {formatMoney(
                        transaction.amount,
                        transaction.currency
                      )}
                    </p>

                    <p
                      className="text-xs mt-1"
                      style={{ color: "#777789" }}
                    >
                      View details →
                    </p>

                  </div>

                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* DETAILS MODAL */}

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-5"
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg border p-6"
            style={{
              background: "#111118",
              borderColor: "rgba(212,160,23,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">

              <div>
                <p
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "#d4a017" }}
                >
                  Transaction Details
                </p>

                <h2 className="text-2xl font-black mt-2">
                  {selected.type === "WITHDRAWAL"
                    ? "Withdrawal"
                    : selected.type}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-9 h-9 flex items-center justify-center"
                style={{
                  color: "#9090a8",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <i className="bx bx-x text-xl" />
              </button>

            </div>

            {/* STATUS */}

            <div
              className="p-5 border mb-5"
              style={{
                background:
                  selected.status === "COMPLETED"
                    ? "rgba(93,204,138,0.06)"
                    : "rgba(212,160,23,0.06)",
                borderColor:
                  selected.status === "COMPLETED"
                    ? "rgba(93,204,138,0.2)"
                    : "rgba(212,160,23,0.2)",
              }}
            >
              <p
                className="text-xs uppercase tracking-widest"
                style={{ color: "#777789" }}
              >
                Status
              </p>

              <p
                className="text-xl font-black mt-2"
                style={{
                  color:
                    selected.status === "COMPLETED"
                      ? "#5dcc8a"
                      : selected.status === "FAILED" ||
                        selected.status === "CANCELLED"
                        ? "#ff7777"
                        : "#d4a017",
                }}
              >
                {selected.status}
              </p>
            </div>

            <div className="space-y-4">

              <div className="flex justify-between gap-4">
                <span style={{ color: "#777789" }}>
                  Amount
                </span>

                <span className="font-bold">
                  {formatMoney(
                    selected.amount,
                    selected.currency
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span style={{ color: "#777789" }}>
                  Type
                </span>

                <span className="font-bold">
                  {selected.type}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span style={{ color: "#777789" }}>
                  Date
                </span>

                <span className="font-semibold text-right">
                  {formatDate(selected.created_at)}
                </span>
              </div>

              {selected.reference && (
                <div>
                  <p
                    className="text-xs mb-2"
                    style={{ color: "#777789" }}
                  >
                    Reference
                  </p>

                  <div
                    className="p-3 border text-xs break-all"
                    style={{
                      borderColor:
                        "rgba(255,255,255,0.08)",
                      color: "#c7c2b8",
                    }}
                  >
                    {selected.reference}
                  </div>
                </div>
              )}

              {selected.description && (
                <div>
                  <p
                    className="text-xs mb-2"
                    style={{ color: "#777789" }}
                  >
                    Description
                  </p>

                  <p className="text-sm">
                    {selected.description}
                  </p>
                </div>
              )}

            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="w-full mt-7 py-4 font-bold"
              style={{
                background: "#d4a017",
                color: "#09090e",
              }}
            >
              Close
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
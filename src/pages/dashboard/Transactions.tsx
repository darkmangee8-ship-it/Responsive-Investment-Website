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
    })
      } `;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case "COMPLETED":
      case "CONFIRMED":
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
      <div className="flex items-center justify-center py-16 sm:py-20">
        <p
          className="text-sm sm:text-base"
          style={{ color: "#9090a8" }}
        >
          Loading transaction history...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">

      {/* HEADER */}

      <div className="mb-6 sm:mb-8">

        <p
          className="text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-widest font-semibold mb-2 sm:mb-3"
          style={{ color: "#d4a017" }}
        >
          Wallet Activity
        </p>

        <h1 className="text-2xl sm:text-3xl font-black leading-tight">
          Transaction History
        </h1>

        <p
          className="mt-2 text-xs sm:text-sm leading-5 sm:leading-6"
          style={{ color: "#9090a8" }}
        >
          View deposits, withdrawals, investments and wallet activity.
        </p>

      </div>

      {/* ERROR */}

      {error && (
        <div
          className="mb-5 sm:mb-6 p-3 sm:p-4 border text-xs sm:text-sm leading-5"
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
          className="p-7 sm:p-10 border text-center"
          style={{
            background: "#111118",
            borderColor: "rgba(212,160,23,0.15)",
          }}
        >

          <i
            className="bx bx-receipt text-3xl sm:text-4xl"
            style={{ color: "#d4a017" }}
          />

          <h2 className="mt-3 sm:mt-4 text-lg sm:text-xl font-bold">
            No transactions yet
          </h2>

          <p
            className="mt-2 text-xs sm:text-sm leading-5"
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
          className="w-full border overflow-hidden"
          style={{
            background: "#111118",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {transactions.map((transaction) => {
            const statusStyle = getStatusStyle(transaction.status);

            const isWithdrawal =
              transaction.type === "WITHDRAWAL";

            return (
              <button
                key={transaction.id}
                type="button"
                onClick={() => setSelected(transaction)}
                className="w-full text-left px-3 py-4 sm:p-5 border-b transition-all hover:bg-white/[0.02]"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >

                <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">

                  {/* ICON */}

                  <div
                    className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center"
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
                      )
                        } text - lg sm: text - xl`}
                    />
                  </div>

                  {/* INFO */}

                  <div className="flex-1 min-w-0">

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">

                      <p className="font-bold text-xs sm:text-base truncate">
                        {transaction.type === "WITHDRAWAL"
                          ? "Withdrawal"
                          : transaction.type}
                      </p>

                      <span
                        className="px-1.5 sm:px-2 py-0.5 sm:py-1 border text-[8px] sm:text-[10px] font-bold uppercase tracking-wide shrink-0"
                        style={statusStyle}
                      >
                        {transaction.status}
                      </span>

                    </div>

                    <p
                      className="text-[10px] sm:text-xs mt-1 truncate"
                      style={{
                        color: "#777789",
                      }}
                    >
                      {transaction.description ||
                        "Transaction activity"}
                    </p>

                    <p
                      className="text-[9px] sm:text-xs mt-1 truncate"
                      style={{
                        color: "#666678",
                      }}
                    >
                      {formatDate(transaction.created_at)}
                    </p>

                  </div>

                  {/* AMOUNT */}

                  <div className="text-right shrink-0 max-w-[115px] sm:max-w-none">

                    <p className="font-black text-xs sm:text-base truncate">
                      {formatMoney(
                        transaction.amount,
                        transaction.currency
                      )}
                    </p>

                    <p
                      className="text-[9px] sm:text-xs mt-1 hidden sm:block"
                      style={{ color: "#777789" }}
                    >
                      View details →
                    </p>

                    <p
                      className="text-[9px] mt-1 sm:hidden"
                      style={{ color: "#777789" }}
                    >
                      View →
                    </p>

                  </div>

                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ==========================================================
          WITHDRAWAL SUCCESS / CONFIRMED MODAL
      ========================================================== */}

      {selected && selected.type === "WITHDRAWAL" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          style={{
            background: "rgba(0,0,0,0.82)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setSelected(null)}
        >

          <div
            className="w-full max-w-xl border my-3 sm:my-8 max-h-[94vh] overflow-y-auto"
            style={{
              background: "#101116",
              borderColor: "rgba(93,204,138,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* GREEN CHECK */}

            <div className="flex flex-col items-center text-center pt-7 sm:pt-10 px-4 sm:px-6">

              <div
                className="w-20 h-20 sm:w-32 sm:h-32 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(93,204,138,0.10)",
                  border: "2px solid rgba(93,204,138,0.38)",
                  boxShadow:
                    "0 0 35px rgba(93,204,138,0.08)",
                }}
              >
                <i
                  className="bx bx-check"
                  style={{
                    color: "#5dcc8a",
                    fontSize: "52px",
                    fontWeight: 700,
                  }}
                />
              </div>

              {/* LABEL */}

              <p
                className="mt-6 sm:mt-10 text-[9px] sm:text-sm uppercase tracking-[0.18em] sm:tracking-[0.35em] font-bold"
                style={{
                  color: "#5dcc8a",
                }}
              >
                Withdrawal Successful
              </p>

              {/* TITLE */}

              <h2
                className="mt-3 sm:mt-5 text-2xl sm:text-4xl md:text-5xl font-black leading-tight"
                style={{
                  color: "#5dcc8a",
                }}
              >
                {selected.status === "CONFIRMED" ||
                  selected.status === "COMPLETED"
                  ? "Withdrawal Confirmed"
                  : "Withdrawn"}
              </h2>

              {/* AMOUNT */}

              <p
                className="mt-4 sm:mt-5 text-2xl sm:text-4xl md:text-5xl font-black break-all"
                style={{
                  color: "#f5f0e8",
                }}
              >
                {formatMoney(
                  selected.amount,
                  selected.currency
                )}
              </p>

            </div>

            {/* STATUS BOX */}

            <div
              className="mx-3 sm:mx-6 mt-6 sm:mt-10 p-4 sm:p-6 border"
              style={{
                background: "#17181e",
                borderColor: "rgba(255,255,255,0.07)",
              }}
            >

              <div className="flex justify-between items-center gap-3">

                <span
                  className="text-sm sm:text-lg"
                  style={{
                    color: "#9090a8",
                  }}
                >
                  Status
                </span>

                <span
                  className="text-sm sm:text-lg font-black uppercase text-right"
                  style={{
                    color:
                      selected.status === "CONFIRMED" ||
                        selected.status === "COMPLETED"
                        ? "#d4a017"
                        : selected.status === "FAILED" ||
                          selected.status === "CANCELLED"
                          ? "#ff7777"
                          : "#d4a017",
                  }}
                >
                  {selected.status === "COMPLETED"
                    ? "CONFIRMED"
                    : selected.status}
                </span>

              </div>

              <div className="flex justify-between items-center gap-3 mt-4 sm:mt-5">

                <span
                  className="text-sm sm:text-lg"
                  style={{
                    color: "#9090a8",
                  }}
                >
                  Amount
                </span>

                <span
                  className="text-sm sm:text-lg font-bold text-right break-all"
                  style={{
                    color: "#f5f0e8",
                  }}
                >
                  {formatMoney(
                    selected.amount,
                    selected.currency
                  )}
                </span>

              </div>

            </div>

            {/* PROCESSING / COMPLETED MESSAGE */}

            <div
              className="mx-3 sm:mx-6 mt-5 sm:mt-8 p-4 sm:p-6 border"
              style={{
                background:
                  selected.status === "CONFIRMED" ||
                    selected.status === "COMPLETED"
                    ? "rgba(93,204,138,0.06)"
                    : "rgba(93,204,138,0.04)",
                borderColor:
                  "rgba(93,204,138,0.15)",
              }}
            >

              <h3
                className="text-sm sm:text-lg font-bold"
                style={{
                  color: "#5dcc8a",
                }}
              >
                {selected.status === "CONFIRMED" ||
                  selected.status === "COMPLETED"
                  ? "Withdrawal Completed"
                  : "Withdrawal Processing"}
              </h3>

              <p
                className="mt-3 sm:mt-4 text-xs sm:text-base leading-6 sm:leading-8 break-words"
                style={{
                  color: "#d7d3cb",
                }}
              >
                {selected.status === "CONFIRMED" ||
                  selected.status === "COMPLETED"
                  ? `Your withdrawal of ${formatMoney(
                    selected.amount,
                    selected.currency
                  )
                  } has been approved and completed successfully.`
                  : "Your withdrawal request has been received successfully. Your funds are being processed."}
              </p>

              {selected.status !== "CONFIRMED" &&
                selected.status !== "COMPLETED" && (
                  <p
                    className="mt-3 sm:mt-4 text-xs sm:text-sm leading-6 sm:leading-7"
                    style={{
                      color: "#777789",
                    }}
                  >
                    Please ensure that the account details you
                    provided are correct. Processing times may vary
                    depending on your bank.
                  </p>
                )}

              {(selected.status === "CONFIRMED" ||
                selected.status === "COMPLETED") && (
                  <p
                    className="mt-3 sm:mt-4 text-xs sm:text-sm leading-6 sm:leading-7"
                    style={{
                      color: "#777789",
                    }}
                  >
                    The withdrawal has been approved by the
                    administration and marked as confirmed.
                  </p>
                )}

            </div>

            {/* DATE */}

            <div
              className="mx-3 sm:mx-6 mt-4 sm:mt-6 text-[10px] sm:text-sm"
              style={{
                color: "#777789",
              }}
            >
              {formatDate(selected.created_at)}
            </div>

            {/* CLOSE */}

            <div className="px-3 sm:px-6 pb-5 sm:pb-8 mt-5 sm:mt-7">

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-full py-3.5 sm:py-5 text-sm sm:text-lg font-black"
                style={{
                  background: "#d4a017",
                  color: "#09090e",
                }}
              >
                Back to Dashboard
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ==========================================================
          OTHER TRANSACTION DETAILS
      ========================================================== */}

      {selected && selected.type !== "WITHDRAWAL" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setSelected(null)}
        >

          <div
            className="w-full max-w-lg border p-4 sm:p-6 my-3 sm:my-8 max-h-[94vh] overflow-y-auto"
            style={{
              background: "#111118",
              borderColor: "rgba(212,160,23,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">

              <div className="min-w-0">

                <p
                  className="text-[9px] sm:text-xs uppercase tracking-widest"
                  style={{
                    color: "#d4a017",
                  }}
                >
                  Transaction Details
                </p>

                <h2 className="text-lg sm:text-2xl font-black mt-1.5 sm:mt-2 truncate">
                  {selected.type}
                </h2>

              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0"
                style={{
                  color: "#9090a8",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <i className="bx bx-x text-lg sm:text-xl" />
              </button>

            </div>

            <div
              className="p-4 sm:p-5 border mb-4 sm:mb-5"
              style={{
                background:
                  selected.status === "COMPLETED" ||
                    selected.status === "CONFIRMED"
                    ? "rgba(93,204,138,0.06)"
                    : "rgba(212,160,23,0.06)",
                borderColor:
                  selected.status === "COMPLETED" ||
                    selected.status === "CONFIRMED"
                    ? "rgba(93,204,138,0.2)"
                    : "rgba(212,160,23,0.2)",
              }}
            >

              <p
                className="text-[9px] sm:text-xs uppercase tracking-widest"
                style={{
                  color: "#777789",
                }}
              >
                Status
              </p>

              <p
                className="text-lg sm:text-xl font-black mt-1.5 sm:mt-2 break-words"
                style={{
                  color:
                    selected.status === "COMPLETED" ||
                      selected.status === "CONFIRMED"
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

              <div className="flex justify-between items-start gap-4 text-xs sm:text-sm">

                <span style={{ color: "#777789" }}>
                  Amount
                </span>

                <span className="font-bold text-right break-all">
                  {formatMoney(
                    selected.amount,
                    selected.currency
                  )}
                </span>

              </div>

              <div className="flex justify-between items-start gap-4 text-xs sm:text-sm">

                <span style={{ color: "#777789" }}>
                  Type
                </span>

                <span className="font-bold text-right">
                  {selected.type}
                </span>

              </div>

              <div className="flex justify-between items-start gap-4 text-xs sm:text-sm">

                <span style={{ color: "#777789" }}>
                  Date
                </span>

                <span className="font-semibold text-right max-w-[65%]">
                  {formatDate(selected.created_at)}
                </span>

              </div>

              {selected.reference && (
                <div>

                  <p
                    className="text-[10px] sm:text-xs mb-2"
                    style={{
                      color: "#777789",
                    }}
                  >
                    Reference
                  </p>

                  <div
                    className="p-3 border text-[10px] sm:text-xs break-all leading-5"
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
                    className="text-[10px] sm:text-xs mb-2"
                    style={{
                      color: "#777789",
                    }}
                  >
                    Description
                  </p>

                  <p className="text-xs sm:text-sm leading-6 break-words">
                    {selected.description}
                  </p>

                </div>
              )}

            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="w-full mt-6 sm:mt-7 py-3.5 sm:py-4 text-sm sm:text-base font-bold"
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
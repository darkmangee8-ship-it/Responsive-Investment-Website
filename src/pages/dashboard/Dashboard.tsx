import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

type Wallet = {
  available_balance: number;
  invested_balance: number;
  total_profit: number;
};

type Investment = {
  id: string;
  principal: number;
  daily_rate: number;
  accrued_profit: number;
  start_date: string;
  maturity_date: string;
  status: string;
};

type Transaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/login", { replace: true });
        return;
      }

      /*
       * WALLET
       */
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select(
          "available_balance, invested_balance, total_profit"
        )
        .eq("user_id", user.id)
        .single();

      if (walletError) {
        console.error("Wallet error:", walletError);
      } else {
        setWallet(walletData);
      }

      /*
       * INVESTMENTS
       *
       * IMPORTANT:
       * Database uses "principal", NOT "amount".
       */
      const { data: investmentData, error: investmentError } =
        await supabase
          .from("investments")
          .select(
            `
              id,
              principal,
              daily_rate,
              accrued_profit,
              start_date,
              maturity_date,
              status
            `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

      if (investmentError) {
        console.error("Investment error:", investmentError);
        setInvestments([]);
      } else {
        setInvestments(investmentData ?? []);
      }

      /*
       * TRANSACTIONS
       */
      const { data: transactionData, error: transactionError } =
        await supabase
          .from("transactions")
          .select(
            "id, type, amount, status, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

      if (transactionError) {
        console.error("Transaction error:", transactionError);
      } else {
        setTransactions(transactionData ?? []);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Unable to load your account data.");
    } finally {
      setLoading(false);
    }
  }

  function money(value: number | null | undefined) {
    return `$${Number(value ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(value: string) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  /*
   * ACTIVE INVESTMENTS
   *
   * Handles ACTIVE / active / Active safely.
   */
  const activeInvestments = investments.filter(
    (investment) =>
      investment.status?.toUpperCase() === "ACTIVE"
  );

  /*
   * Calculate these directly from investments.
   *
   * This means the overview does not depend on
   * wallets.invested_balance or wallets.total_profit
   * being manually updated.
   */
  const calculatedInvestedBalance = activeInvestments.reduce(
    (total, investment) =>
      total + Number(investment.principal ?? 0),
    0
  );

  const calculatedTotalProfit = investments.reduce(
    (total, investment) =>
      total + Number(investment.accrued_profit ?? 0),
    0
  );

  const totalWalletBalance =
    Number(wallet?.available_balance ?? 0) +
    calculatedTotalProfit;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "#9090a8" }}>
          Loading your account...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p style={{ color: "#e05050" }}>{error}</p>

          <button
            onClick={loadDashboard}
            className="mt-4 px-6 py-3 font-semibold"
            style={{
              background: "#d4a017",
              color: "#09090e",
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-black">
          Dashboard
        </h1>

        <p
          className="mt-2 text-sm"
          style={{ color: "#9090a8" }}
        >
          Welcome back. Here's your account overview.
        </p>
      </div>

      {/* WALLET / OVERVIEW CARDS */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">

        <StatCard
          title="Total Wallet Balance"
          value={money(totalWalletBalance)}
          gold
        />

        <StatCard
          title="Available Balance"
          value={money(wallet?.available_balance)}
        />

        <StatCard
          title="Invested Balance"
          value={money(calculatedInvestedBalance)}
        />

        <StatCard
          title="Total Profit"
          value={money(calculatedTotalProfit)}
        />

      </div>

      {/* QUICK ACTIONS */}

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">

        <ActionButton
          to="/dashboard/deposit"
          title="Deposit"
          description="Fund your wallet"
        />

        <ActionButton
          to="/dashboard/plans"
          title="Invest"
          description="Choose an investment plan"
        />

        <ActionButton
          to="/dashboard/withdraw"
          title="Withdraw"
          description="Request a withdrawal"
        />

      </div>

      {/* INVESTMENTS */}

      <section className="mt-10">

        <div className="flex items-center justify-between mb-5">

          <div>
            <h2 className="text-xl font-bold">
              Your Investments
            </h2>

            <p
              className="text-sm mt-1"
              style={{ color: "#9090a8" }}
            >
              Your current investment positions.
            </p>
          </div>

          <Link
            to="/dashboard/investments"
            className="text-sm"
            style={{ color: "#d4a017" }}
          >
            View all →
          </Link>

        </div>

        {investments.length === 0 ? (

          <div
            className="p-8 border"
            style={{
              background: "#111118",
              borderColor: "rgba(212,160,23,0.15)",
            }}
          >
            <p className="font-semibold">
              No investments yet
            </p>

            <p
              className="text-sm mt-2"
              style={{ color: "#9090a8" }}
            >
              Choose an available investment plan when
              you're ready.
            </p>

            <Link
              to="/dashboard/plans"
              className="inline-block mt-5 px-5 py-3 text-sm font-bold"
              style={{
                background: "#d4a017",
                color: "#09090e",
              }}
            >
              View Investment Plans
            </Link>
          </div>

        ) : (

          <div className="space-y-4">

            {investments.slice(0, 3).map((investment) => (

              <div
                key={investment.id}
                className="p-6 border"
                style={{
                  background: "#111118",
                  borderColor: "rgba(212,160,23,0.15)",
                }}
              >

                <div className="grid grid-cols-2 md:grid-cols-5 gap-5">

                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "#9090a8" }}
                    >
                      Investment
                    </p>

                    <p className="text-xl font-bold mt-1">
                      {money(investment.principal)}
                    </p>
                  </div>

                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "#9090a8" }}
                    >
                      Daily Rate
                    </p>

                    <p className="font-semibold mt-1">
                      {Number(investment.daily_rate).toFixed(2)}%
                    </p>
                  </div>

                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "#9090a8" }}
                    >
                      Accrued Profit
                    </p>

                    <p
                      className="font-semibold mt-1"
                      style={{ color: "#d4a017" }}
                    >
                      {money(investment.accrued_profit)}
                    </p>
                  </div>

                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "#9090a8" }}
                    >
                      Maturity
                    </p>

                    <p className="font-semibold mt-1">
                      {formatDate(investment.maturity_date)}
                    </p>
                  </div>

                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "#9090a8" }}
                    >
                      Status
                    </p>

                    <span
                      className="inline-block mt-2 px-3 py-1 text-xs font-semibold"
                      style={{
                        background:
                          investment.status?.toUpperCase() === "ACTIVE"
                            ? "rgba(50,180,100,0.1)"
                            : "rgba(212,160,23,0.1)",
                        color:
                          investment.status?.toUpperCase() === "ACTIVE"
                            ? "#5dcc8a"
                            : "#d4a017",
                      }}
                    >
                      {investment.status}
                    </span>
                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

      {/* TRANSACTIONS */}

      <section className="mt-10">

        <div className="flex items-center justify-between mb-5">

          <div>
            <h2 className="text-xl font-bold">
              Recent Transactions
            </h2>

            <p
              className="text-sm mt-1"
              style={{ color: "#9090a8" }}
            >
              Your latest account activity.
            </p>
          </div>

          <Link
            to="/dashboard/transactions"
            className="text-sm"
            style={{ color: "#d4a017" }}
          >
            View all →
          </Link>

        </div>

        <div
          className="border overflow-hidden"
          style={{
            background: "#111118",
            borderColor: "rgba(212,160,23,0.15)",
          }}
        >

          {transactions.length === 0 ? (

            <div
              className="p-8 text-center"
              style={{ color: "#9090a8" }}
            >
              No transactions yet.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[520px] text-sm">

                <thead
                  style={{
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <tr>

                    <th className="text-left p-4">
                      Type
                    </th>

                    <th className="text-left p-4">
                      Amount
                    </th>

                    <th className="text-left p-4">
                      Status
                    </th>

                    <th className="text-left p-4">
                      Date
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {transactions.map((transaction) => (

                    <tr
                      key={transaction.id}
                      className="border-t"
                      style={{
                        borderColor:
                          "rgba(255,255,255,0.05)",
                      }}
                    >

                      <td className="p-4 font-semibold">
                        {transaction.type}
                      </td>

                      <td className="p-4">
                        {money(transaction.amount)}
                      </td>

                      <td className="p-4">
                        {transaction.status}
                      </td>

                      <td
                        className="p-4"
                        style={{
                          color: "#9090a8",
                        }}
                      >
                        {formatDate(transaction.created_at)}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </section>

    </div>
  );
}


/*
 * STAT CARD
 */

function StatCard({
  title,
  value,
  gold = false,
}: {
  title: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div
      className="p-6 border"
      style={{
        background: "#111118",
        borderColor: "rgba(212,160,23,0.15)",
      }}
    >

      <p
        className="text-sm"
        style={{ color: "#9090a8" }}
      >
        {title}
      </p>

      <p
        className="text-2xl font-black mt-3"
        style={gold ? { color: "#d4a017" } : undefined}
      >
        {value}
      </p>

    </div>
  );
}


/*
 * ACTION BUTTON
 */

function ActionButton({
  to,
  title,
  description,
}: {
  to: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="block p-5 border transition-all"
      style={{
        background: "#111118",
        borderColor: "rgba(212,160,23,0.15)",
      }}
    >

      <p className="font-bold">
        {title}
      </p>

      <p
        className="text-xs mt-1"
        style={{ color: "#9090a8" }}
      >
        {description}
      </p>

    </Link>
  );
}
import { useEffect, useState } from "react";
import { Link } from "react-router";
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
  status: string;
  start_date: string;
  maturity_date: string | null;
};

export default function Dashboard() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [firstName, setFirstName] = useState("User");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [profileResult, walletResult, investmentsResult] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("first_name")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("wallets")
            .select(
              "available_balance, invested_balance, total_profit"
            )
            .eq("user_id", user.id)
            .maybeSingle(),

          supabase
            .from("investments")
            .select(
              "id, principal, daily_rate, accrued_profit, status, start_date, maturity_date"
            )
            .eq("user_id", user.id)
            .eq("status", "ACTIVE")
            .order("created_at", {
              ascending: false,
            }),
        ]);

      if (profileResult.data?.first_name) {
        setFirstName(profileResult.data.first_name);
      }

      setWallet(
        walletResult.data ?? {
          available_balance: 0,
          invested_balance: 0,
          total_profit: 0,
        }
      );

      setInvestments(
        (investmentsResult.data ?? []) as Investment[]
      );
    } catch (error) {
      console.error("DASHBOARD ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  function money(value: number | null | undefined) {
    return Number(value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function calculateDailyProfit(investment: Investment) {
    return (
      Number(investment.principal) *
      Number(investment.daily_rate) /
      100
    );
  }

  function formatDate(date: string | null) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p
          className="text-sm"
          style={{ color: "#777789" }}
        >
          Loading your dashboard...
        </p>
      </div>
    );
  }

  const available = Number(
    wallet?.available_balance ?? 0
  );

  const invested = Number(
    wallet?.invested_balance ?? 0
  );

  const profit = Number(
    wallet?.total_profit ?? 0
  );

  const totalWallet = available + profit;

  return (
    <div className="space-y-8">

      {/* =====================================================
          WELCOME
      ===================================================== */}

      <section>
        <p
          className="text-xs uppercase tracking-[0.25em] font-bold"
          style={{ color: "#d4a017" }}
        >
          Member Dashboard
        </p>

        <h1 className="mt-2 text-3xl sm:text-4xl font-black">
          Welcome back, {firstName} 👋
        </h1>

        <p
          className="mt-2 text-sm"
          style={{ color: "#9090a8" }}
        >
          Here's a simple overview of your account.
        </p>
      </section>

      {/* =====================================================
          TOTAL WALLET
      ===================================================== */}

      <section
        className="relative overflow-hidden p-6 sm:p-8 border"
        style={{
          background:
            "linear-gradient(135deg, #15151d 0%, #101016 100%)",
          borderColor: "rgba(212,160,23,0.25)",
        }}
      >
        <div
          className="absolute -right-16 -top-16 w-48 h-48 rounded-full"
          style={{
            background:
              "rgba(212,160,23,0.07)",
          }}
        />

        <div className="relative">

          <p
            className="text-xs uppercase tracking-widest font-bold"
            style={{ color: "#9090a8" }}
          >
            Total Wallet Balance
          </p>

          <div className="mt-3 flex items-end gap-3">
            <span className="text-4xl sm:text-5xl font-black">
              ${money(totalWallet)}
            </span>
          </div>

          <p
            className="mt-3 text-sm"
            style={{ color: "#777789" }}
          >
            Available balance + accrued profit
          </p>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-4">

            <BalanceItem
              label="Available"
              value={`$${money(available)} `}
            />

            <BalanceItem
              label="Invested"
              value={`$${money(invested)} `}
            />

            <BalanceItem
              label="Total Profit"
              value={`$${money(profit)} `}
              positive
            />

          </div>

        </div>
      </section>

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">
            Quick Actions
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          <QuickAction
            to="/dashboard/deposit"
            icon="+"
            title="Deposit"
            description="Add funds"
          />

          <QuickAction
            to="/dashboard/withdraw"
            icon="↓"
            title="Withdraw"
            description="Request funds"
          />

          <QuickAction
            to="/dashboard/plans"
            icon="▣"
            title="Invest"
            description="View plans"
          />

          <QuickAction
            to="/dashboard/transactions"
            icon="≡"
            title="Activity"
            description="View history"
          />

        </div>

      </section>

      {/* =====================================================
          ACTIVE INVESTMENTS
      ===================================================== */}

      <section>

        <div className="flex items-center justify-between mb-4">

          <div>
            <h2 className="text-xl font-black">
              Active Investments
            </h2>

            <p
              className="text-sm mt-1"
              style={{ color: "#777789" }}
            >
              Your current investment positions.
            </p>
          </div>

          <Link
            to="/dashboard/investments"
            className="text-sm font-bold"
            style={{ color: "#d4a017" }}
          >
            View all
          </Link>

        </div>

        {investments.length === 0 ? (
          <div
            className="p-8 border text-center"
            style={{
              background: "#111118",
              borderColor:
                "rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="mx-auto w-12 h-12 flex items-center justify-center text-xl"
              style={{
                background:
                  "rgba(212,160,23,0.08)",
                color: "#d4a017",
              }}
            >
              ▣
            </div>

            <h3 className="mt-4 font-bold">
              No active investments
            </h3>

            <p
              className="mt-2 text-sm"
              style={{ color: "#777789" }}
            >
              Explore our investment plans to get started.
            </p>

            <Link
              to="/dashboard/plans"
              className="inline-block mt-5 px-6 py-3 text-sm font-bold"
              style={{
                background: "#d4a017",
                color: "#09090e",
              }}
            >
              Explore Plans
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {investments.slice(0, 4).map((investment) => {

              const dailyProfit =
                calculateDailyProfit(investment);

              return (
                <div
                  key={investment.id}
                  className="p-6 border"
                  style={{
                    background: "#111118",
                    borderColor:
                      "rgba(255,255,255,0.08)",
                  }}
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p
                        className="text-xs uppercase tracking-widest font-bold"
                        style={{
                          color: "#d4a017",
                        }}
                      >
                        Active Investment
                      </p>

                      <h3 className="mt-2 text-xl font-black">
                        ${money(investment.principal)}
                      </h3>
                    </div>

                    <span
                      className="px-3 py-1 text-xs font-bold"
                      style={{
                        color: "#71d69a",
                        background:
                          "rgba(50,180,100,0.08)",
                      }}
                    >
                      ACTIVE
                    </span>

                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">

                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "#777789" }}
                      >
                        Daily Rate
                      </p>

                      <p className="mt-1 font-bold">
                        {Number(
                          investment.daily_rate
                        ).toFixed(2)}
                        %
                      </p>
                    </div>

                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "#777789" }}
                      >
                        Today's Profit
                      </p>

                      <p
                        className="mt-1 font-bold"
                        style={{ color: "#71d69a" }}
                      >
                        +${money(dailyProfit)}
                      </p>
                    </div>

                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "#777789" }}
                      >
                        Accrued Profit
                      </p>

                      <p className="mt-1 font-bold">
                        ${money(
                          investment.accrued_profit
                        )}
                      </p>
                    </div>

                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "#777789" }}
                      >
                        Started
                      </p>

                      <p className="mt-1 font-bold">
                        {formatDate(
                          investment.start_date
                        )}
                      </p>
                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* =====================================================
          GET STARTED
      ===================================================== */}

      <section
        className="p-6 sm:p-8 border"
        style={{
          background:
            "rgba(212,160,23,0.04)",
          borderColor:
            "rgba(212,160,23,0.15)",
        }}
      >

        <h2 className="text-xl font-black">
          Manage your account
        </h2>

        <p
          className="mt-2 text-sm max-w-2xl"
          style={{ color: "#9090a8" }}
        >
          Everything you need is available from your dashboard.
          Fund your wallet, choose an investment plan, monitor
          your investments and keep track of your activity.
        </p>

        <div className="flex flex-wrap gap-3 mt-6">

          <Link
            to="/dashboard/deposit"
            className="px-6 py-3 text-sm font-bold"
            style={{
              background: "#d4a017",
              color: "#09090e",
            }}
          >
            Deposit Funds
          </Link>

          <Link
            to="/dashboard/plans"
            className="px-6 py-3 text-sm font-bold border"
            style={{
              borderColor:
                "rgba(212,160,23,0.25)",
              color: "#d4a017",
            }}
          >
            View Investment Plans
          </Link>

        </div>

      </section>

    </div>
  );
}


/* ============================================================
   SMALL COMPONENTS
============================================================ */

function BalanceItem({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      className="p-4 border"
      style={{
        background:
          "rgba(255,255,255,0.025)",
        borderColor:
          "rgba(255,255,255,0.06)",
      }}
    >
      <p
        className="text-xs"
        style={{ color: "#777789" }}
      >
        {label}
      </p>

      <p
        className="mt-2 font-bold"
        style={{
          color: positive
            ? "#71d69a"
            : "#f5f0e8",
        }}
      >
        {value}
      </p>
    </div>
  );
}


function QuickAction({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="p-5 border transition-transform hover:-translate-y-0.5"
      style={{
        background: "#111118",
        borderColor:
          "rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="w-10 h-10 flex items-center justify-center text-lg font-black"
        style={{
          background:
            "rgba(212,160,23,0.08)",
          color: "#d4a017",
        }}
      >
        {icon}
      </div>

      <p className="mt-4 font-bold">
        {title}
      </p>

      <p
        className="mt-1 text-xs"
        style={{ color: "#777789" }}
      >
        {description}
      </p>
    </Link>
  );
}

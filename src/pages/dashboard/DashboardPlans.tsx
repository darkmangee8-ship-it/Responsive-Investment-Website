import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  minimum_amount: number;
  maximum_amount: number | null;
  daily_rate: number;
  duration_days: number;
};

type Wallet = {
  available_balance: number;
  total_profit: number;
};

export default function DashboardPlans() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const [plansResult, walletResult] = await Promise.all([
      supabase
        .from("investment_plans")
        .select(
          "id, name, description, minimum_amount, maximum_amount, daily_rate, duration_days"
        )
        .eq("status", "ACTIVE")
        .order("minimum_amount", { ascending: true }),

      supabase
        .from("wallets")
        .select("available_balance, total_profit")
        .eq("user_id", user.id)
        .single(),
    ]);

    if (plansResult.error) {
      console.error("Plans error:", plansResult.error);
      setMessage("Unable to load investment plans.");
    } else {
      setPlans(plansResult.data ?? []);
    }

    if (walletResult.error) {
      console.error("Wallet error:", walletResult.error);
      setMessage("Unable to load your wallet balance.");
    } else {
      setWallet(walletResult.data);
    }

    setLoading(false);
  }

  function money(value: number | null | undefined) {
    return `$${Number(value ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      } `;
  }

  /*
   * Total Balance
   *
   * Total Balance = Available Balance + Total Profit
   */
  const totalBalance =
    Number(wallet?.available_balance ?? 0) +
    Number(wallet?.total_profit ?? 0);

  function selectPlan(plan: Plan) {
    setSelectedPlan(plan);
    setAmount(String(plan.minimum_amount));
    setMessage("");
  }

  async function continueInvestment() {
    if (!selectedPlan) return;

    setMessage("");

    const numericAmount = Number(amount);

    /*
     * Investment spending balance
     *
     * The user can invest from their Total Balance,
     * which consists of Available Balance + Total Profit.
     */
    const balance =
      Number(wallet?.available_balance ?? 0) +
      Number(wallet?.total_profit ?? 0);

    if (!numericAmount || numericAmount <= 0) {
      setMessage("Please enter a valid investment amount.");
      return;
    }

    if (numericAmount < selectedPlan.minimum_amount) {
      setMessage(
        `The minimum investment for ${selectedPlan.name} is ${money(
          selectedPlan.minimum_amount
        )
        }.`
      );
      return;
    }

    if (
      selectedPlan.maximum_amount !== null &&
      numericAmount > selectedPlan.maximum_amount
    ) {
      setMessage(
        `The maximum investment for ${selectedPlan.name} is ${money(
          selectedPlan.maximum_amount
        )
        }.`
      );
      return;
    }

    if (numericAmount > balance) {
      setMessage(
        `Insufficient balance.Your total balance is ${money(
          balance
        )
        }.`
      );
      return;
    }

    setLoading(true);

    try {
      const { data: result, error } = await supabase.rpc(
        "create_investment",
        {
          p_plan_id: selectedPlan.id,
          p_amount: numericAmount,
        }
      );

      if (error) {
        console.error("Investment error:", error);
        setMessage(
          error.message ||
          "Unable to create the investment."
        );
        return;
      }

      if (!result?.success) {
        setMessage(
          result?.message ||
          "Unable to create the investment."
        );
        return;
      }

      navigate("/dashboard/investments");
    } catch (error) {
      console.error(error);
      setMessage(
        "Unable to create investment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-black">
          Investment Plans
        </h1>

        <p
          className="mt-3"
          style={{ color: "#9090a8" }}
        >
          Loading available plans...
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
          Investment Plans
        </p>

        <h1 className="text-3xl lg:text-4xl font-black">
          Choose an investment plan
        </h1>

        <p
          className="mt-3 text-sm"
          style={{ color: "#9090a8" }}
        >
          Choose an available plan and invest using
          your total wallet balance.
        </p>
      </div>

      {/* TOTAL BALANCE */}
      <div
        className="mb-8 p-6 border"
        style={{
          background: "#111118",
          borderColor:
            "rgba(212,160,23,0.2)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p
              className="text-sm"
              style={{ color: "#9090a8" }}
            >
              Total Balance
            </p>

            <p
              className="text-3xl font-black mt-2"
              style={{ color: "#d4a017" }}
            >
              {money(totalBalance)}
            </p>

            <p
              className="mt-2 text-xs"
              style={{ color: "#777789" }}
            >
              Available Balance + Total Profit
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard/deposit")
            }
            className="px-5 py-3 text-sm font-bold"
            style={{
              background: "#d4a017",
              color: "#09090e",
            }}
          >
            Deposit Funds
          </button>
        </div>
      </div>

      {/* INFORMATION MESSAGE */}
      {message && (
        <div
          className="mb-8 p-4 border text-sm"
          style={{
            background:
              "rgba(180,40,40,0.08)",
            borderColor:
              "rgba(220,80,80,0.3)",
            color: "#ffb4b4",
          }}
        >
          {message}
        </div>
      )}

      {/* PLANS */}
      {plans.length === 0 ? (
        <div
          className="p-8 border"
          style={{
            background: "#111118",
            borderColor:
              "rgba(212,160,23,0.15)",
          }}
        >
          <h2 className="text-xl font-bold">
            No investment plans available
          </h2>

          <p
            className="mt-2 text-sm"
            style={{ color: "#9090a8" }}
          >
            There are currently no active
            investment plans.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const selected =
              selectedPlan?.id === plan.id;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() =>
                  selectPlan(plan)
                }
                className="text-left p-6 border transition-all"
                style={{
                  background: selected
                    ? "rgba(212,160,23,0.08)"
                    : "#111118",
                  borderColor: selected
                    ? "#d4a017"
                    : "rgba(212,160,23,0.15)",
                }}
              >
                <p
                  className="text-xs uppercase tracking-widest"
                  style={{
                    color: "#9090a8",
                  }}
                >
                  Investment Plan
                </p>

                <h2
                  className="text-2xl font-black mt-2"
                  style={{
                    color: "#d4a017",
                  }}
                >
                  {plan.name}
                </h2>

                {plan.description && (
                  <p
                    className="mt-3 text-sm"
                    style={{
                      color: "#9090a8",
                    }}
                  >
                    {plan.description}
                  </p>
                )}

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span
                      style={{
                        color: "#9090a8",
                      }}
                    >
                      Minimum
                    </span>

                    <span>
                      {money(
                        plan.minimum_amount
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span
                      style={{
                        color: "#9090a8",
                      }}
                    >
                      Maximum
                    </span>

                    <span>
                      {plan.maximum_amount ===
                        null
                        ? "No limit"
                        : money(
                          plan.maximum_amount
                        )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span
                      style={{
                        color: "#9090a8",
                      }}
                    >
                      Daily rate
                    </span>

                    <span
                      style={{
                        color: "#d4a017",
                      }}
                    >
                      {Number(
                        plan.daily_rate
                      ).toFixed(2)}
                      %
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span
                      style={{
                        color: "#9090a8",
                      }}
                    >
                      Duration
                    </span>

                    <span>
                      {plan.duration_days} days
                    </span>
                  </div>
                </div>

                <div
                  className="mt-6 text-xs font-semibold"
                  style={{
                    color: selected
                      ? "#d4a017"
                      : "#777789",
                  }}
                >
                  {selected
                    ? "Selected ✓"
                    : "Select plan →"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* INVESTMENT AMOUNT */}
      {selectedPlan && (
        <div
          className="mt-8 p-6 border"
          style={{
            background: "#111118",
            borderColor:
              "rgba(212,160,23,0.2)",
          }}
        >
          <h2 className="text-xl font-bold">
            Invest in {selectedPlan.name}
          </h2>

          <p
            className="mt-2 text-sm"
            style={{ color: "#9090a8" }}
          >
            Minimum investment:{" "}
            {money(
              selectedPlan.minimum_amount
            )}
          </p>

          <p
            className="mt-2 text-sm"
            style={{ color: "#9090a8" }}
          >
            Total available balance:{" "}
            <span
              style={{ color: "#d4a017" }}
            >
              {money(totalBalance)}
            </span>
          </p>

          <label className="block mt-6 mb-2 text-sm font-semibold">
            Investment Amount
          </label>

          <input
            type="number"
            min={
              selectedPlan.minimum_amount
            }
            max={
              selectedPlan.maximum_amount ??
              undefined
            }
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setMessage("");
            }}
            className="w-full px-4 py-4 bg-transparent border outline-none"
            style={{
              color: "#f5f0e8",
              borderColor:
                "rgba(212,160,23,0.3)",
            }}
          />

          <button
            type="button"
            onClick={continueInvestment}
            disabled={loading}
            className="mt-5 px-6 py-4 font-bold"
            style={{
              background: loading
                ? "#6d5a1f"
                : "#d4a017",
              color: "#09090e",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Creating Investment..."
              : "Invest Now →"}
          </button>
        </div>
      )}
    </div>
  );
}
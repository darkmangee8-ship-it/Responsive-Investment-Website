import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

type WalletData = {
  available_balance: number;
  invested_balance: number;
  total_profit: number;
};

export default function Wallet() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("wallets")
      .select("available_balance, invested_balance, total_profit")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error(error);
    } else {
      setWallet(data);
    }

    setLoading(false);
  }

  function money(value: number | undefined) {
    return `$${Number(value ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      } `;
  }

  // Total Balance = Available Balance + Total Profit
  const totalBalance =
    Number(wallet?.available_balance ?? 0) +
    Number(wallet?.total_profit ?? 0);

  if (loading) {
    return <p style={{ color: "#9090a8" }}>Loading wallet...</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black">Wallet</h1>
        <p className="mt-2 text-sm" style={{ color: "#9090a8" }}>
          Manage your account balance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <WalletCard
          title="Total Balance"
          value={money(totalBalance)}
          gold
        />

        <WalletCard
          title="Available Balance"
          value={money(wallet?.available_balance)}
        />

        <WalletCard
          title="Invested Balance"
          value={money(wallet?.invested_balance)}
        />

        <WalletCard
          title="Total Profit"
          value={money(wallet?.total_profit)}
          gold
        />
      </div>

      <div className="flex flex-wrap gap-4 mt-8">
        <Link
          to="/dashboard/deposit"
          className="px-6 py-3 text-sm font-bold"
          style={{
            background: "#d4a017",
            color: "#09090e",
          }}
        >
          Deposit
        </Link>

        <Link
          to="/dashboard/withdraw"
          className="px-6 py-3 text-sm font-bold border"
          style={{
            borderColor: "rgba(212,160,23,0.3)",
            color: "#d4a017",
          }}
        >
          Withdraw
        </Link>
      </div>
    </div>
  );
}

function WalletCard({
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
        borderColor: "rgba(212,160,23,0.2)",
      }}
    >
      <p className="text-sm" style={{ color: "#9090a8" }}>
        {title}
      </p>

      <p
        className="text-3xl font-black mt-3"
        style={gold ? { color: "#d4a017" } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
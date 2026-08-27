import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

type AccountStatus = "ACTIVE" | "SUSPENDED" | "DISABLED";

type User = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  status: AccountStatus;
  is_admin: boolean;
  created_at: string;
  available_balance: number;
  invested_balance: number;
  total_profit: number;
};

type Deposit = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  amount: number;
  currency: string;
  provider: string;
  provider_reference: string;
  status: string;
  created_at: string;
};

type AuditLog = {
  id: string;
  action: string;
  admin_id: string;
  admin_name: string;
  target_user_id: string | null;
  target_user_name: string | null;
  amount: number | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

type Stats = {
  total_users: number;
  active_users: number;
  suspended_users: number;
  disabled_users: number;
  pending_deposits: number;
  confirmed_deposits: number;
  total_available_balance: number;
  total_invested_balance: number;
  total_profit: number;
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeSection, setActiveSection] = useState<
    "overview" | "users" | "deposits" | "audit"
  >("overview");

  const [search, setSearch] = useState("");

  const [balanceModal, setBalanceModal] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceDirection, setBalanceDirection] = useState<
    "ADD" | "SUBTRACT"
  >("ADD");
  const [balanceReason, setBalanceReason] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id,is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(profileError);
        setError("Unable to verify administrator access.");
        return;
      }

      if (!profile?.is_admin) {
        setError("You do not have administrator access.");
        return;
      }

      await loadAll();

    } catch (err) {
      console.error(err);
      setError("Unable to load administrator dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAll() {
    setError("");

    await Promise.all([
      loadUsers(),
      loadDeposits(),
      loadAuditLogs(),
      loadStats(),
    ]);
  }

  async function loadUsers() {
    const { data, error } = await supabase.rpc("admin_get_users");

    if (error) {
      console.error("USERS ERROR:", error);
      setError(error.message);
      return;
    }

    setUsers((data ?? []) as User[]);
  }

  async function loadDeposits() {
    const { data, error } = await supabase.rpc(
      "admin_get_pending_deposits"
    );

    if (error) {
      console.error("DEPOSITS ERROR:", error);
      setError(error.message);
      return;
    }

    setDeposits((data ?? []) as Deposit[]);
  }

  async function loadAuditLogs() {
    const { data, error } = await supabase.rpc(
      "admin_get_audit_logs"
    );

    if (error) {
      console.error("AUDIT ERROR:", error);
      setError(error.message);
      return;
    }

    setAuditLogs((data ?? []) as AuditLog[]);
  }

  async function loadStats() {
    const { data, error } = await supabase.rpc(
      "admin_get_stats"
    );

    if (error) {
      console.error("STATS ERROR:", error);
      setError(error.message);
      return;
    }

    setStats(data as Stats);
  }

  async function approveDeposit(depositId: string) {
    if (processing) return;

    setProcessing(depositId);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "approve_deposit",
        {
          p_deposit_id: depositId,
        }
      );

      if (error) {
        console.error("APPROVE DEPOSIT ERROR:", error);
        setError(error.message);
        return;
      }

      setMessage("Deposit approved and wallet credited.");

      await loadAll();

    } finally {
      setProcessing(null);
    }
  }

  async function rejectDeposit(depositId: string) {
    if (processing) return;

    setProcessing(depositId);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "reject_deposit",
        {
          p_deposit_id: depositId,
        }
      );

      if (error) {
        console.error("REJECT DEPOSIT ERROR:", error);
        setError(error.message);
        return;
      }

      setMessage("Deposit cancelled successfully.");

      await loadAll();

    } finally {
      setProcessing(null);
    }
  }

  async function updateUserStatus(
    user: User,
    status: AccountStatus
  ) {
    if (processing) return;

    setProcessing(user.id);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "admin_update_user_status",
        {
          p_user_id: user.id,
          p_status: status,
        }
      );

      if (error) {
        console.error("STATUS ERROR:", error);
        setError(error.message);
        return;
      }

      setMessage(
        `${getUserName(user)} is now ${status}.`
      );

      await loadAll();

    } finally {
      setProcessing(null);
    }
  }

  async function adjustBalance() {
    if (!balanceModal) return;

    const amount = Number(balanceAmount);

    if (!amount || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (!balanceReason.trim()) {
      setError("Enter a reason for this adjustment.");
      return;
    }

    setProcessing(balanceModal.id);
    setError("");
    setMessage("");

    try {
      const { data, error } = await supabase.rpc(
        "admin_adjust_wallet",
        {
          p_user_id: balanceModal.id,
          p_amount: amount,
          p_direction: balanceDirection,
          p_reason: balanceReason.trim(),
        }
      );

      if (error) {
        console.error("BALANCE ADJUSTMENT ERROR:", error);
        setError(error.message);
        return;
      }

      setMessage(
        balanceDirection === "ADD"
          ? `₦${amount.toLocaleString()} added successfully.`
          : `₦${amount.toLocaleString()} deducted successfully.`
      );

      console.log("Balance adjustment:", data);

      setBalanceModal(null);
      setBalanceAmount("");
      setBalanceReason("");
      setBalanceDirection("ADD");

      await loadAll();

    } finally {
      setProcessing(null);
    }
  }

  function getUserName(user: User) {
    const name = `${user.first_name ?? ""} ${user.last_name ?? ""
      }`.trim();

    return name || "Unnamed User";
  }

  function formatMoney(value: number | null | undefined) {
    return Number(value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function filteredUsers() {
    const q = search.toLowerCase().trim();

    if (!q) return users;

    return users.filter((user) =>
      [
        user.first_name,
        user.last_name,
        user.email,
        user.phone,
        user.country,
        user.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "#09090e",
          color: "#f5f0e8",
        }}
      >
        <p style={{ color: "#9090a8" }}>
          Loading administrator dashboard...
        </p>
      </div>
    );
  }

  if (error && !stats && users.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{
          background: "#09090e",
          color: "#f5f0e8",
        }}
      >
        <div
          className="w-full max-w-md p-8 border"
          style={{
            background: "#111118",
            borderColor: "rgba(212,160,23,0.2)",
          }}
        >
          <h1 className="text-2xl font-black mb-4">
            Administrator Access
          </h1>

          <p
            className="text-sm"
            style={{ color: "#e05050" }}
          >
            {error}
          </p>

          <button
            onClick={logout}
            className="mt-6 px-5 py-3 font-bold"
            style={{
              background: "#d4a017",
              color: "#09090e",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#09090e",
        color: "#f5f0e8",
      }}
    >
      {/* HEADER */}

      <header
        className="border-b"
        style={{
          background: "#111118",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p
              className="text-xs uppercase tracking-widest font-bold"
              style={{ color: "#d4a017" }}
            >
              Musk Enterprise
            </p>

            <h1 className="text-2xl font-black mt-1">
              Admin Control Center
            </h1>
          </div>

          <button
            onClick={logout}
            className="px-5 py-2.5 border text-sm font-bold"
            style={{
              borderColor: "rgba(212,160,23,0.25)",
              color: "#d4a017",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>


      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ALERTS */}

        {message && (
          <div
            className="mb-5 p-4 border"
            style={{
              background: "rgba(50,180,100,0.06)",
              borderColor: "rgba(50,180,100,0.2)",
              color: "#71d69a",
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="mb-5 p-4 border"
            style={{
              background: "rgba(255,70,70,0.06)",
              borderColor: "rgba(255,70,70,0.2)",
              color: "#ff8b8b",
            }}
          >
            {error}
          </div>
        )}


        {/* NAVIGATION */}

        <div
          className="flex flex-wrap gap-2 mb-8 p-2 border"
          style={{
            background: "#111118",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {[
            ["overview", "Overview"],
            ["users", "Users"],
            ["deposits", "Deposits"],
            ["audit", "Audit History"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() =>
                setActiveSection(
                  value as
                  | "overview"
                  | "users"
                  | "deposits"
                  | "audit"
                )
              }
              className="px-5 py-3 text-sm font-bold"
              style={{
                background:
                  activeSection === value
                    ? "#d4a017"
                    : "transparent",
                color:
                  activeSection === value
                    ? "#09090e"
                    : "#9090a8",
              }}
            >
              {label}
            </button>
          ))}
        </div>


        {/* ==================================================
            OVERVIEW
        ================================================== */}

        {activeSection === "overview" && stats && (
          <div>

            <div className="mb-8">
              <h2 className="text-3xl font-black">
                Platform Overview
              </h2>

              <p
                className="mt-2"
                style={{ color: "#9090a8" }}
              >
                Monitor users, deposits and wallet activity.
              </p>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              <StatCard
                title="Total Users"
                value={stats.total_users}
              />

              <StatCard
                title="Active Users"
                value={stats.active_users}
              />

              <StatCard
                title="Pending Deposits"
                value={stats.pending_deposits}
              />

              <StatCard
                title="Confirmed Deposits"
                value={stats.confirmed_deposits}
              />

              <StatCard
                title="Available Balance"
                value={`$${formatMoney(
                  stats.total_available_balance
                )}`}
              />

              <StatCard
                title="Invested Balance"
                value={`$${formatMoney(
                  stats.total_invested_balance
                )}`}
              />

              <StatCard
                title="Total Profit"
                value={`$${formatMoney(
                  stats.total_profit
                )}`}
              />

              <StatCard
                title="Suspended Users"
                value={stats.suspended_users}
              />

            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

              <QuickCard
                title="Pending Deposits"
                value={stats.pending_deposits}
                description="Deposits waiting for administrator review."
                action={() => setActiveSection("deposits")}
                button="Review Deposits"
              />

              <QuickCard
                title="User Management"
                value={stats.total_users}
                description="View accounts, balances and account status."
                action={() => setActiveSection("users")}
                button="Manage Users"
              />

            </div>

          </div>
        )}


        {/* ==================================================
            USERS
        ================================================== */}

        {activeSection === "users" && (
          <div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-6">

              <div>
                <h2 className="text-3xl font-black">
                  User Management
                </h2>

                <p
                  className="mt-2"
                  style={{ color: "#9090a8" }}
                >
                  Manage accounts, statuses and wallet balances.
                </p>
              </div>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search users..."
                className="px-4 py-3 border outline-none w-full md:w-80"
                style={{
                  background: "#111118",
                  borderColor:
                    "rgba(255,255,255,0.1)",
                  color: "#f5f0e8",
                }}
              />

            </div>


            <div
              className="border overflow-hidden"
              style={{
                background: "#111118",
                borderColor:
                  "rgba(255,255,255,0.08)",
              }}
            >
              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>
                    <tr
                      className="text-left border-b"
                      style={{
                        borderColor:
                          "rgba(255,255,255,0.08)",
                      }}
                    >
                      <th className="p-5">
                        User
                      </th>

                      <th className="p-5">
                        Contact
                      </th>

                      <th className="p-5">
                        Status
                      </th>

                      <th className="p-5">
                        Available
                      </th>

                      <th className="p-5">
                        Invested
                      </th>

                      <th className="p-5">
                        Actions
                      </th>
                    </tr>
                  </thead>


                  <tbody>

                    {filteredUsers().map((user) => {

                      const name = getUserName(user);
                      const isProcessing =
                        processing === user.id;

                      return (
                        <tr
                          key={user.id}
                          className="border-b"
                          style={{
                            borderColor:
                              "rgba(255,255,255,0.06)",
                          }}
                        >

                          <td className="p-5">
                            <div className="font-bold">
                              {name}
                            </div>

                            {user.is_admin && (
                              <span
                                className="text-xs"
                                style={{
                                  color: "#d4a017",
                                }}
                              >
                                Administrator
                              </span>
                            )}
                          </td>


                          <td className="p-5">

                            <div>
                              {user.email || "—"}
                            </div>

                            <div
                              className="text-xs mt-1"
                              style={{
                                color: "#9090a8",
                              }}
                            >
                              {user.phone || "No phone"}
                              {user.country
                                ? ` • ${user.country}`
                                : ""}
                            </div>

                          </td>


                          <td className="p-5">

                            <span
                              className="inline-flex px-3 py-1 text-xs font-bold"
                              style={{
                                background:
                                  user.status ===
                                    "ACTIVE"
                                    ? "rgba(50,180,100,0.1)"
                                    : user.status ===
                                      "SUSPENDED"
                                      ? "rgba(212,160,23,0.1)"
                                      : "rgba(220,70,70,0.1)",

                                color:
                                  user.status ===
                                    "ACTIVE"
                                    ? "#71d69a"
                                    : user.status ===
                                      "SUSPENDED"
                                      ? "#d4a017"
                                      : "#ff8b8b",
                              }}
                            >
                              {user.status}
                            </span>

                          </td>


                          <td className="p-5 font-bold whitespace-nowrap">
                            ${formatMoney(
                              user.available_balance
                            )}
                          </td>


                          <td className="p-5 whitespace-nowrap">
                            ${formatMoney(
                              user.invested_balance
                            )}
                          </td>


                          <td className="p-5">

                            <div className="flex flex-wrap gap-2">

                              <button
                                disabled={
                                  !!processing ||
                                  user.is_admin
                                }
                                onClick={() =>
                                  setBalanceModal(user)
                                }
                                className="px-3 py-2 text-xs font-bold"
                                style={{
                                  background:
                                    "#d4a017",
                                  color: "#09090e",
                                  opacity:
                                    user.is_admin
                                      ? 0.4
                                      : 1,
                                }}
                              >
                                Adjust Balance
                              </button>


                              {!user.is_admin && (
                                <>
                                  {user.status !==
                                    "ACTIVE" && (
                                      <button
                                        disabled={
                                          !!processing
                                        }
                                        onClick={() =>
                                          updateUserStatus(
                                            user,
                                            "ACTIVE"
                                          )
                                        }
                                        className="px-3 py-2 text-xs font-bold border"
                                        style={{
                                          borderColor:
                                            "rgba(50,180,100,0.3)",
                                          color:
                                            "#71d69a",
                                        }}
                                      >
                                        Activate
                                      </button>
                                    )}


                                  {user.status !==
                                    "SUSPENDED" && (
                                      <button
                                        disabled={
                                          !!processing
                                        }
                                        onClick={() =>
                                          updateUserStatus(
                                            user,
                                            "SUSPENDED"
                                          )
                                        }
                                        className="px-3 py-2 text-xs font-bold border"
                                        style={{
                                          borderColor:
                                            "rgba(212,160,23,0.3)",
                                          color:
                                            "#d4a017",
                                        }}
                                      >
                                        Suspend
                                      </button>
                                    )}


                                  {user.status !==
                                    "DISABLED" && (
                                      <button
                                        disabled={
                                          !!processing
                                        }
                                        onClick={() =>
                                          updateUserStatus(
                                            user,
                                            "DISABLED"
                                          )
                                        }
                                        className="px-3 py-2 text-xs font-bold border"
                                        style={{
                                          borderColor:
                                            "rgba(220,70,70,0.3)",
                                          color:
                                            "#ff8b8b",
                                        }}
                                      >
                                        Disable
                                      </button>
                                    )}
                                </>
                              )}

                            </div>

                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>
            </div>

          </div>
        )}


        {/* ==================================================
            DEPOSITS
        ================================================== */}

        {activeSection === "deposits" && (
          <div>

            <div className="mb-6">
              <h2 className="text-3xl font-black">
                Deposit Management
              </h2>

              <p
                className="mt-2"
                style={{ color: "#9090a8" }}
              >
                Review and process pending deposits.
              </p>
            </div>


            <div
              className="border overflow-hidden"
              style={{
                background: "#111118",
                borderColor:
                  "rgba(255,255,255,0.08)",
              }}
            >

              {deposits.length === 0 ? (

                <div
                  className="p-16 text-center"
                  style={{
                    color: "#9090a8",
                  }}
                >
                  No pending deposits.
                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full text-sm">

                    <thead>
                      <tr
                        className="text-left border-b"
                        style={{
                          borderColor:
                            "rgba(255,255,255,0.08)",
                        }}
                      >
                        <th className="p-5">
                          User
                        </th>

                        <th className="p-5">
                          Amount
                        </th>

                        <th className="p-5">
                          Provider
                        </th>

                        <th className="p-5">
                          Reference
                        </th>

                        <th className="p-5">
                          Date
                        </th>

                        <th className="p-5">
                          Action
                        </th>
                      </tr>
                    </thead>


                    <tbody>

                      {deposits.map((deposit) => {

                        const isProcessing =
                          processing ===
                          deposit.id;

                        const userName =
                          `${deposit.first_name ?? ""} ${deposit.last_name ?? ""
                            }`.trim() ||
                          "Unknown User";

                        return (
                          <tr
                            key={deposit.id}
                            className="border-b"
                            style={{
                              borderColor:
                                "rgba(255,255,255,0.06)",
                            }}
                          >

                            <td className="p-5">

                              <div className="font-bold">
                                {userName}
                              </div>

                              <div
                                className="text-xs mt-1"
                                style={{
                                  color:
                                    "#9090a8",
                                }}
                              >
                                {deposit.email}
                              </div>

                            </td>


                            <td className="p-5 font-bold whitespace-nowrap">
                              {deposit.currency}{" "}
                              {formatMoney(
                                deposit.amount
                              )}
                            </td>


                            <td className="p-5">
                              {deposit.provider}
                            </td>


                            <td
                              className="p-5 font-mono text-xs"
                              style={{
                                color:
                                  "#c7c2b8",
                              }}
                            >
                              {deposit.provider_reference ||
                                "—"}
                            </td>


                            <td
                              className="p-5 whitespace-nowrap"
                              style={{
                                color:
                                  "#9090a8",
                              }}
                            >
                              {new Date(
                                deposit.created_at
                              ).toLocaleString()}
                            </td>


                            <td className="p-5">

                              <div className="flex gap-2">

                                <button
                                  disabled={
                                    !!processing
                                  }
                                  onClick={() =>
                                    approveDeposit(
                                      deposit.id
                                    )
                                  }
                                  className="px-4 py-2 text-xs font-bold"
                                  style={{
                                    background:
                                      "#d4a017",
                                    color:
                                      "#09090e",
                                  }}
                                >
                                  {isProcessing
                                    ? "Processing..."
                                    : "Approve"}
                                </button>


                                <button
                                  disabled={
                                    !!processing
                                  }
                                  onClick={() =>
                                    rejectDeposit(
                                      deposit.id
                                    )
                                  }
                                  className="px-4 py-2 text-xs font-bold border"
                                  style={{
                                    borderColor:
                                      "rgba(220,70,70,0.3)",
                                    color:
                                      "#ff8b8b",
                                  }}
                                >
                                  Cancel
                                </button>

                              </div>

                            </td>

                          </tr>
                        );
                      })}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </div>
        )}


        {/* ==================================================
            AUDIT HISTORY
        ================================================== */}

        {activeSection === "audit" && (
          <div>

            <div className="mb-6">
              <h2 className="text-3xl font-black">
                Admin Audit History
              </h2>

              <p
                className="mt-2"
                style={{ color: "#9090a8" }}
              >
                Track administrator actions across the platform.
              </p>
            </div>


            <div
              className="border overflow-hidden"
              style={{
                background: "#111118",
                borderColor:
                  "rgba(255,255,255,0.08)",
              }}
            >

              {auditLogs.length === 0 ? (

                <div
                  className="p-16 text-center"
                  style={{
                    color: "#9090a8",
                  }}
                >
                  No administrative activity yet.
                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full text-sm">

                    <thead>
                      <tr
                        className="text-left border-b"
                        style={{
                          borderColor:
                            "rgba(255,255,255,0.08)",
                        }}
                      >
                        <th className="p-5">
                          Action
                        </th>

                        <th className="p-5">
                          Administrator
                        </th>

                        <th className="p-5">
                          User
                        </th>

                        <th className="p-5">
                          Amount
                        </th>

                        <th className="p-5">
                          Details
                        </th>

                        <th className="p-5">
                          Date
                        </th>
                      </tr>
                    </thead>


                    <tbody>

                      {auditLogs.map((log) => (

                        <tr
                          key={log.id}
                          className="border-b"
                          style={{
                            borderColor:
                              "rgba(255,255,255,0.06)",
                          }}
                        >

                          <td className="p-5">

                            <span
                              className="px-3 py-1 text-xs font-bold"
                              style={{
                                background:
                                  "rgba(212,160,23,0.1)",
                                color:
                                  "#d4a017",
                              }}
                            >
                              {log.action.replace(
                                /_/g,
                                " "
                              )}
                            </span>

                          </td>


                          <td className="p-5">
                            {log.admin_name ||
                              "Administrator"}
                          </td>


                          <td className="p-5">
                            {log.target_user_name ||
                              "—"}
                          </td>


                          <td className="p-5 font-bold">
                            {log.amount
                              ? `$${formatMoney(
                                log.amount
                              )}`
                              : "—"}
                          </td>


                          <td
                            className="p-5 max-w-md"
                            style={{
                              color:
                                "#9090a8",
                            }}
                          >
                            {log.details
                              ? Object.entries(
                                log.details
                              )
                                .map(
                                  ([key, value]) =>
                                    `${key}: ${String(
                                      value
                                    )}`
                                )
                                .join(" • ")
                              : "—"}
                          </td>


                          <td
                            className="p-5 whitespace-nowrap"
                            style={{
                              color:
                                "#9090a8",
                            }}
                          >
                            {new Date(
                              log.created_at
                            ).toLocaleString()}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </div>
        )}

      </div>


      {/* ====================================================
          WALLET ADJUSTMENT MODAL
      ==================================================== */}

      {balanceModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{
            background:
              "rgba(0,0,0,0.75)",
          }}
        >

          <div
            className="w-full max-w-lg p-7 border"
            style={{
              background: "#111118",
              borderColor:
                "rgba(212,160,23,0.25)",
            }}
          >

            <div className="flex justify-between items-start mb-6">

              <div>
                <h2 className="text-2xl font-black">
                  Adjust Wallet
                </h2>

                <p
                  className="text-sm mt-1"
                  style={{
                    color: "#9090a8",
                  }}
                >
                  {getUserName(balanceModal)}
                </p>
              </div>

              <button
                onClick={() =>
                  setBalanceModal(null)
                }
                className="text-xl"
                style={{
                  color: "#9090a8",
                }}
              >
                ×
              </button>

            </div>


            <div
              className="p-4 mb-6"
              style={{
                background:
                  "rgba(212,160,23,0.06)",
              }}
            >

              <p
                className="text-xs"
                style={{
                  color: "#9090a8",
                }}
              >
                Current Available Balance
              </p>

              <p
                className="text-2xl font-black mt-1"
                style={{
                  color: "#d4a017",
                }}
              >
                ${formatMoney(
                  balanceModal.available_balance
                )}
              </p>

            </div>


            {/* ADD / SUBTRACT */}

            <div className="grid grid-cols-2 gap-3 mb-5">

              <button
                onClick={() =>
                  setBalanceDirection("ADD")
                }
                className="p-4 border text-left"
                style={{
                  borderColor:
                    balanceDirection === "ADD"
                      ? "#d4a017"
                      : "rgba(255,255,255,0.1)",
                  background:
                    balanceDirection === "ADD"
                      ? "rgba(212,160,23,0.08)"
                      : "transparent",
                }}
              >
                <div className="font-bold">
                  + Add Funds
                </div>

                <div
                  className="text-xs mt-1"
                  style={{
                    color: "#9090a8",
                  }}
                >
                  Increase balance
                </div>
              </button>


              <button
                onClick={() =>
                  setBalanceDirection(
                    "SUBTRACT"
                  )
                }
                className="p-4 border text-left"
                style={{
                  borderColor:
                    balanceDirection ===
                      "SUBTRACT"
                      ? "#ff8b8b"
                      : "rgba(255,255,255,0.1)",
                  background:
                    balanceDirection ===
                      "SUBTRACT"
                      ? "rgba(255,70,70,0.06)"
                      : "transparent",
                }}
              >
                <div className="font-bold">
                  − Reduce Funds
                </div>

                <div
                  className="text-xs mt-1"
                  style={{
                    color: "#9090a8",
                  }}
                >
                  Decrease balance
                </div>
              </button>

            </div>


            <label
              className="block text-sm font-bold mb-2"
            >
              Amount
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={balanceAmount}
              onChange={(e) =>
                setBalanceAmount(
                  e.target.value
                )
              }
              placeholder="Enter amount"
              className="w-full px-4 py-3 border mb-5 outline-none"
              style={{
                background: "#09090e",
                borderColor:
                  "rgba(255,255,255,0.1)",
                color: "#f5f0e8",
              }}
            />


            <label
              className="block text-sm font-bold mb-2"
            >
              Reason
            </label>

            <textarea
              value={balanceReason}
              onChange={(e) =>
                setBalanceReason(
                  e.target.value
                )
              }
              placeholder="Why is this adjustment being made?"
              rows={3}
              className="w-full px-4 py-3 border mb-6 outline-none resize-none"
              style={{
                background: "#09090e",
                borderColor:
                  "rgba(255,255,255,0.1)",
                color: "#f5f0e8",
              }}
            />


            {balanceDirection ===
              "SUBTRACT" && (
                <div
                  className="p-3 mb-5 text-xs border"
                  style={{
                    color: "#ffb0b0",
                    borderColor:
                      "rgba(255,70,70,0.2)",
                    background:
                      "rgba(255,70,70,0.05)",
                  }}
                >
                  The database will prevent this
                  adjustment if it would make the
                  available balance negative.
                </div>
              )}


            <div className="flex gap-3">

              <button
                onClick={() =>
                  setBalanceModal(null)
                }
                className="flex-1 px-5 py-3 border font-bold"
                style={{
                  borderColor:
                    "rgba(255,255,255,0.1)",
                  color: "#9090a8",
                }}
              >
                Cancel
              </button>


              <button
                onClick={adjustBalance}
                disabled={
                  processing ===
                  balanceModal.id
                }
                className="flex-1 px-5 py-3 font-bold"
                style={{
                  background:
                    balanceDirection ===
                      "ADD"
                      ? "#d4a017"
                      : "#b84b4b",
                  color: "#09090e",
                }}
              >
                {processing ===
                  balanceModal.id
                  ? "Processing..."
                  : balanceDirection ===
                    "ADD"
                    ? "Add Funds"
                    : "Reduce Funds"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}


/* ============================================================
   SMALL COMPONENTS
============================================================ */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div
      className="p-6 border"
      style={{
        background: "#111118",
        borderColor:
          "rgba(255,255,255,0.08)",
      }}
    >
      <p
        className="text-xs uppercase tracking-wider"
        style={{
          color: "#9090a8",
        }}
      >
        {title}
      </p>

      <p
        className="text-2xl font-black mt-3"
        style={{
          color: "#d4a017",
        }}
      >
        {value}
      </p>
    </div>
  );
}


function QuickCard({
  title,
  value,
  description,
  action,
  button,
}: {
  title: string;
  value: string | number;
  description: string;
  action: () => void;
  button: string;
}) {
  return (
    <div
      className="p-6 border"
      style={{
        background: "#111118",
        borderColor:
          "rgba(255,255,255,0.08)",
      }}
    >
      <p
        className="text-sm"
        style={{
          color: "#9090a8",
        }}
      >
        {title}
      </p>

      <p className="text-3xl font-black mt-2">
        {value}
      </p>

      <p
        className="text-sm mt-3 mb-5"
        style={{
          color: "#9090a8",
        }}
      >
        {description}
      </p>

      <button
        onClick={action}
        className="px-5 py-3 text-sm font-bold"
        style={{
          background: "#d4a017",
          color: "#09090e",
        }}
      >
        {button}
      </button>
    </div>
  );
}
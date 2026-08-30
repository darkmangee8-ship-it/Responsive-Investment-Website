import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  LayoutGrid,
  Users,
  CreditCard,
  Wallet,
  Bell,
  FileText,
  LogOut,
  Menu,
  CircleDollarSign,
  Activity,
  X,
} from "lucide-react";
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

type Withdrawal = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  amount: number;
  currency: string;
  destination: string;
  status: string;
  created_at: string;
  processed_at: string | null;
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

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  user_name?: string | null;
  user_email?: string | null;
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

type OnlinePresence = {
  user_id: string;
  online_at: string;
};

type Section =
  | "overview"
  | "users"
  | "deposits"
  | "withdrawals"
  | "notifications"
  | "audit";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const [onlineUsers, setOnlineUsers] = useState<OnlinePresence[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [processing, setProcessing] = useState<string | null>(null);
  const [sendingNotification, setSendingNotification] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeSection, setActiveSection] =
    useState<Section>("overview");

  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /*
   * ============================================================
   * WALLET ADJUSTMENT
   * ============================================================
   */

  const [balanceModal, setBalanceModal] =
    useState<User | null>(null);

  const [balanceAmount, setBalanceAmount] =
    useState("");

  const [balanceDirection, setBalanceDirection] =
    useState<"ADD" | "SUBTRACT">("ADD");

  const [balanceReason, setBalanceReason] =
    useState("");

  /*
   * ============================================================
   * NOTIFICATION FORM
   * ============================================================
   */

  const [notificationUser, setNotificationUser] =
    useState<User | null>(null);

  const [notificationTitle, setNotificationTitle] =
    useState("");

  const [notificationMessage, setNotificationMessage] =
    useState("");

  /*
   * ============================================================
   * ADMIN CHECK
   * ============================================================
   */

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
        navigate("/login", {
          replace: true,
        });

        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id,is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(profileError);

        setError(
          "Unable to verify administrator access."
        );

        return;
      }

      if (!profile?.is_admin) {
        setError(
          "You do not have administrator access."
        );

        return;
      }

      await loadAll();
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load administrator dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * LOAD EVERYTHING
   * ============================================================
   */

  async function loadAll() {
    setError("");

    await Promise.all([
      loadUsers(),
      loadDeposits(),
      loadWithdrawals(),
      loadAuditLogs(),
      loadStats(),
      loadNotifications(),
    ]);
  }

  /*
   * ============================================================
   * USERS
   * ============================================================
   */

  async function loadUsers() {
    const {
      data,
      error,
    } = await supabase.rpc("admin_get_users");

    if (error) {
      console.error(
        "USERS ERROR:",
        error
      );

      setError(error.message);
      return;
    }

    setUsers((data ?? []) as User[]);
  }

  /*
   * ============================================================
   * DEPOSITS
   * ============================================================
   */

  async function loadDeposits() {
    const {
      data,
      error,
    } = await supabase.rpc(
      "admin_get_pending_deposits"
    );

    if (error) {
      console.error(
        "DEPOSITS ERROR:",
        error
      );

      setError(error.message);
      return;
    }

    setDeposits((data ?? []) as Deposit[]);
  }

  /*
   * ============================================================
   * WITHDRAWALS
   * ============================================================
   */

  async function loadWithdrawals() {
    const {
      data,
      error,
    } = await supabase.rpc(
      "admin_get_withdrawals"
    );

    if (error) {
      console.error(
        "WITHDRAWALS ERROR:",
        error
      );

      setError(error.message);
      return;
    }

    setWithdrawals(
      (data ?? []) as Withdrawal[]
    );
  }

  /*
   * ============================================================
   * AUDIT
   * ============================================================
   */

  async function loadAuditLogs() {
    const {
      data,
      error,
    } = await supabase.rpc(
      "admin_get_audit_logs"
    );

    if (error) {
      console.error(
        "AUDIT ERROR:",
        error
      );

      setError(error.message);
      return;
    }

    setAuditLogs(
      (data ?? []) as AuditLog[]
    );
  }

  /*
   * ============================================================
   * STATISTICS
   * ============================================================
   */

  async function loadStats() {
    const {
      data,
      error,
    } = await supabase.rpc(
      "admin_get_stats"
    );

    if (error) {
      console.error(
        "STATS ERROR:",
        error
      );

      setError(error.message);
      return;
    }

    setStats(data as Stats);
  }

  /*
   * ============================================================
   * NOTIFICATION HISTORY
   * ============================================================
   */

  async function loadNotifications() {
    setLoadingNotifications(true);

    const {
      data,
      error,
    } = await supabase.rpc(
      "admin_get_notifications"
    );

    if (error) {
      console.error(
        "NOTIFICATIONS ERROR:",
        error
      );

      setError(error.message);
      setLoadingNotifications(false);

      return;
    }

    setNotifications(
      (data ?? []) as Notification[]
    );

    setLoadingNotifications(false);
  }

  /*
   * ============================================================
   * SEND NOTIFICATION
   * ============================================================
   */

  async function sendNotification() {
    if (sendingNotification) return;

    setError("");
    setMessage("");

    if (!notificationUser) {
      setError(
        "Please select a user."
      );

      return;
    }

    if (!notificationTitle.trim()) {
      setError(
        "Please enter a notification title."
      );

      return;
    }

    if (!notificationMessage.trim()) {
      setError(
        "Please enter a notification message."
      );

      return;
    }

    setSendingNotification(true);

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "admin_send_notification",
        {
          p_user_id:
            notificationUser.id,

          p_title:
            notificationTitle.trim(),

          p_message:
            notificationMessage.trim(),
        }
      );

      if (error) {
        console.error(
          "SEND NOTIFICATION ERROR:",
          error
        );

        setError(error.message);
        return;
      }

      if (!data?.success) {
        setError(
          data?.message ??
          "Unable to send notification."
        );

        return;
      }

      setMessage(
        `Notification sent to ${notificationUser.first_name ||
        notificationUser.email ||
        "user"
        }.`
      );

      setNotificationUser(null);
      setNotificationTitle("");
      setNotificationMessage("");

      await loadNotifications();
    } catch (err) {
      console.error(err);

      setError(
        "Unable to send notification."
      );
    } finally {
      setSendingNotification(false);
    }
  }

  /*
   * ============================================================
   * APPROVE DEPOSIT
   * ============================================================
   */

  async function approveDeposit(
    depositId: string
  ) {
    if (processing) return;

    setProcessing(depositId);
    setError("");
    setMessage("");

    try {
      const {
        error,
      } = await supabase.rpc(
        "approve_deposit",
        {
          p_deposit_id:
            depositId,
        }
      );

      if (error) {
        console.error(
          "APPROVE DEPOSIT ERROR:",
          error
        );

        setError(error.message);
        return;
      }

      setMessage(
        "Deposit approved and wallet credited."
      );

      await loadAll();
    } finally {
      setProcessing(null);
    }
  }

  /*
   * ============================================================
   * REJECT DEPOSIT
   * ============================================================
   */

  async function rejectDeposit(
    depositId: string
  ) {
    if (processing) return;

    setProcessing(depositId);
    setError("");
    setMessage("");

    try {
      const {
        error,
      } = await supabase.rpc(
        "reject_deposit",
        {
          p_deposit_id:
            depositId,
        }
      );

      if (error) {
        console.error(
          "REJECT DEPOSIT ERROR:",
          error
        );

        setError(error.message);
        return;
      }

      setMessage(
        "Deposit cancelled successfully."
      );

      await loadAll();
    } finally {
      setProcessing(null);
    }
  }

  /*
   * ============================================================
   * APPROVE WITHDRAWAL
   * ============================================================
   */

  async function approveWithdrawal(
    withdrawalId: string
  ) {
    if (processing) return;

    setProcessing(withdrawalId);
    setError("");
    setMessage("");

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "admin_approve_withdrawal",
        {
          p_withdrawal_id:
            withdrawalId,
        }
      );

      if (error) {
        console.error(
          "APPROVE WITHDRAWAL ERROR:",
          error
        );

        setError(error.message);
        return;
      }

      const amount = Number(
        data?.amount ?? 0
      );

      setMessage(
        `Withdrawal of ${formatMoney(
          amount
        )} approved successfully.`
      );

      await loadAll();
    } finally {
      setProcessing(null);
    }
  }

  /*
   * ============================================================
   * REJECT WITHDRAWAL
   * ============================================================
   */

  async function rejectWithdrawal(
    withdrawalId: string
  ) {
    if (processing) return;

    setProcessing(withdrawalId);
    setError("");
    setMessage("");

    try {
      const {
        error,
      } = await supabase.rpc(
        "admin_reject_withdrawal",
        {
          p_withdrawal_id:
            withdrawalId,
        }
      );

      if (error) {
        console.error(
          "REJECT WITHDRAWAL ERROR:",
          error
        );

        setError(error.message);
        return;
      }

      setMessage(
        "Withdrawal rejected and the funds were returned to the user's available balance."
      );

      await loadAll();
    } finally {
      setProcessing(null);
    }
  }

  /*
   * ============================================================
   * UPDATE USER STATUS
   * ============================================================
   */

  async function updateUserStatus(
    user: User,
    status: AccountStatus
  ) {
    if (processing) return;

    setProcessing(user.id);
    setError("");
    setMessage("");

    try {
      const {
        error,
      } = await supabase.rpc(
        "admin_update_user_status",
        {
          p_user_id: user.id,
          p_status: status,
        }
      );

      if (error) {
        console.error(
          "STATUS ERROR:",
          error
        );

        setError(error.message);
        return;
      }

      setMessage(
        `${getUserName(
          user
        )} is now ${status}.`
      );

      await loadAll();
    } finally {
      setProcessing(null);
    }
  }

  /*
   * ============================================================
   * ADJUST BALANCE
   * ============================================================
   */

  async function adjustBalance() {
    if (!balanceModal) return;

    const amount =
      Number(balanceAmount);

    if (!amount || amount <= 0) {
      setError(
        "Enter a valid amount."
      );

      return;
    }

    if (!balanceReason.trim()) {
      setError(
        "Enter a reason for this adjustment."
      );

      return;
    }

    setProcessing(
      balanceModal.id
    );

    setError("");
    setMessage("");

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "admin_adjust_wallet",
        {
          p_user_id:
            balanceModal.id,

          p_amount: amount,

          p_direction:
            balanceDirection,

          p_reason:
            balanceReason.trim(),
        }
      );

      if (error) {
        console.error(
          "BALANCE ADJUSTMENT ERROR:",
          error
        );

        setError(error.message);
        return;
      }

      setMessage(
        balanceDirection === "ADD"
          ? `$${formatMoney(
            amount
          )} added successfully.`
          : `$${formatMoney(
            amount
          )} deducted successfully.`
      );

      console.log(
        "Balance adjustment:",
        data
      );

      setBalanceModal(null);
      setBalanceAmount("");
      setBalanceReason("");
      setBalanceDirection("ADD");

      await loadAll();
    } finally {
      setProcessing(null);
    }
  }

  /*
   * ============================================================
   * REALTIME PRESENCE
   * ============================================================
   *
   * IMPORTANT:
   *
   * DashboardLayout also uses:
   *
   *     site-presence
   *
   * Therefore the admin listens to that SAME channel.
   *
   * We DO NOT put useState/useEffect outside the component.
   * ============================================================
   */

  useEffect(() => {
    let channel:
      | ReturnType<typeof supabase.channel>
      | null = null;

    let cancelled = false;

    async function setupPresence() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        return;
      }

      channel = supabase.channel(
        "site-presence",
        {
          config: {
            presence: {
              key: user.id,
            },
          },
        }
      );

      function updateOnlineUsers() {
        if (!channel) return;

        const state =
          channel.presenceState();

        const online: OnlinePresence[] =
          [];

        Object.entries(state).forEach(
          ([userId, presences]) => {
            const presence =
              presences?.[0] as
              | {
                user_id?: string;
                online_at?: string;
              }
              | undefined;

            if (presence) {
              online.push({
                user_id:
                  presence.user_id ??
                  userId,

                online_at:
                  presence.online_at ??
                  new Date().toISOString(),
              });
            }
          }
        );

        setOnlineUsers(online);
      }

      channel.on(
        "presence",
        {
          event: "sync",
        },
        updateOnlineUsers
      );

      channel.on(
        "presence",
        {
          event: "join",
        },
        updateOnlineUsers
      );

      channel.on(
        "presence",
        {
          event: "leave",
        },
        updateOnlineUsers
      );

      channel.subscribe(
        (status) => {
          if (status === "SUBSCRIBED") {
            updateOnlineUsers();
          }
        }
      );
    }

    setupPresence();

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(
          channel
        );

        channel = null;
      }
    };
  }, []);

  /*
   * ============================================================
   * HELPERS
   * ============================================================
   */

  function getUserName(
    user: User
  ) {
    const name =
      `${user.first_name ?? ""} ${user.last_name ?? ""
        }`.trim();

    return name || "Unnamed User";
  }

  function formatMoney(
    value:
      | number
      | null
      | undefined
  ) {
    return Number(
      value ?? 0
    ).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  function filteredUsers() {
    const q =
      search
        .toLowerCase()
        .trim();

    if (!q) {
      return users;
    }

    return users.filter(
      (user) =>
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

  function isUserOnline(
    userId: string
  ) {
    return onlineUsers.some(
      (online) =>
        online.user_id ===
        userId
    );
  }

  function onlineUserCount() {
    return onlineUsers.filter(
      (online) =>
        users.some(
          (user) =>
            user.id ===
            online.user_id &&
            !user.is_admin
        )
    ).length;
  }

  async function logout() {
    await supabase.auth.signOut();

    navigate("/login", {
      replace: true,
    });
  }

  /*
   * ============================================================
   * NAVIGATION
   * ============================================================
   */

  const navigationItems = [
    {
      value:
        "overview" as const,
      label: "Overview",
      icon: LayoutGrid,
    },
    {
      value:
        "users" as const,
      label: "Users",
      icon: Users,
    },
    {
      value:
        "deposits" as const,
      label: "Deposits",
      icon: CreditCard,
    },
    {
      value:
        "withdrawals" as const,
      label: "Withdrawals",
      icon: Wallet,
    },
    {
      value:
        "notifications" as const,
      label: "Notifications",
      icon: Bell,
    },
    {
      value:
        "audit" as const,
      label: "Audit History",
      icon: FileText,
    },
  ];

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "#09090e",
          color: "#f5f0e8",
        }}
      >
        <div className="text-center">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor:
                "#d4a017",
              borderTopColor:
                "transparent",
            }}
          />

          <p
            className="text-sm"
            style={{
              color: "#9090a8",
            }}
          >
            Loading administrator dashboard...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * ACCESS DENIED
   * ============================================================
   */

  if (
    error &&
    !stats &&
    users.length === 0
  ) {
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
            borderColor:
              "rgba(212,160,23,0.2)",
          }}
        >
          <h1 className="text-2xl font-black mb-4">
            Administrator Access
          </h1>

          <p
            className="text-sm"
            style={{
              color: "#ff8b8b",
            }}
          >
            {error}
          </p>

          <button
            onClick={logout}
            className="mt-6 px-5 py-3 font-bold"
            style={{
              background:
                "#d4a017",
              color: "#09090e",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * MAIN ADMIN PAGE
   * ============================================================
   */

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#09090e",
        color: "#f5f0e8",
      }}
    >
      {/* ======================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside
        className="fixed top-0 left-0 h-screen w-64 border-r hidden lg:flex flex-col z-40"
        style={{
          background:
            "#0d0d14",
          borderColor:
            "rgba(212,160,23,0.15)",
        }}
      >
        {/* LOGO */}

        <div
          className="border-b px-6 py-6"
          style={{
            borderColor:
              "rgba(212,160,23,0.15)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg font-black text-sm"
              style={{
                background:
                  "#d4a017",
                color:
                  "#09090e",
              }}
            >
              ME
            </div>

            <div>
              <div className="font-bold text-sm">
                Musk Enterprise
              </div>

              <div
                className="text-xs uppercase tracking-widest"
                style={{
                  color:
                    "#777789",
                }}
              >
                Admin
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          {navigationItems.map(
            ({
              value,
              label,
              icon: IconComponent,
            }) => (
              <button
                key={value}
                onClick={() => {
                  setActiveSection(
                    value
                  );

                  setMobileMenuOpen(
                    false
                  );
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all"
                style={{
                  background:
                    activeSection ===
                      value
                      ? "rgba(212,160,23,0.15)"
                      : "transparent",

                  color:
                    activeSection ===
                      value
                      ? "#d4a017"
                      : "#9090a8",
                }}
              >
                <IconComponent
                  size={18}
                  strokeWidth={1.8}
                />

                <span>
                  {label}
                </span>

                {value ===
                  "notifications" &&
                  notifications.filter(
                    (n) => !n.read
                  ).length > 0 && (
                    <span
                      className="ml-auto min-w-5 h-5 px-1 flex items-center justify-center rounded-full text-[10px] font-black"
                      style={{
                        background:
                          "#d4a017",
                        color:
                          "#09090e",
                      }}
                    >
                      {
                        notifications.filter(
                          (n) =>
                            !n.read
                        ).length
                      }
                    </span>
                  )}
              </button>
            )
          )}
        </nav>

        {/* ONLINE STATUS */}

        <div
          className="mx-4 mb-4 p-4 border rounded-lg"
          style={{
            background:
              "rgba(93,204,138,0.04)",
            borderColor:
              "rgba(93,204,138,0.15)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background:
                  "#5dcc8a",
                boxShadow:
                  "0 0 8px rgba(93,204,138,0.7)",
              }}
            />

            <span className="text-xs font-bold">
              {onlineUserCount()} users online
            </span>
          </div>
        </div>

        {/* LOGOUT */}

        <div
          className="border-t p-4"
          style={{
            borderColor:
              "rgba(212,160,23,0.15)",
          }}
        >
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg"
            style={{
              color:
                "#ff6b6b",
            }}
          >
            <LogOut
              size={18}
            />

            <span>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        className="sticky top-0 z-30 border-b lg:ml-64"
        style={{
          background:
            "rgba(17,17,24,0.95)",
          borderColor:
            "rgba(212,160,23,0.12)",
          backdropFilter:
            "blur(12px)",
        }}
      >
        <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setMobileMenuOpen(
                  !mobileMenuOpen
                )
              }
              className="lg:hidden p-2 rounded-lg"
              style={{
                background:
                  "rgba(212,160,23,0.1)",
                color:
                  "#d4a017",
              }}
            >
              {mobileMenuOpen ? (
                <X size={20} />
              ) : (
                <Menu
                  size={20}
                />
              )}
            </button>

            <div>
              <p
                className="text-xs uppercase tracking-widest font-bold"
                style={{
                  color:
                    "#d4a017",
                }}
              >
                Musk Enterprise
              </p>

              <h1 className="text-lg sm:text-xl font-bold">
                Admin Control Center
              </h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-5">
            <div className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background:
                    "#5dcc8a",
                  boxShadow:
                    "0 0 8px rgba(93,204,138,0.7)",
                }}
              />

              <span
                style={{
                  color:
                    "#9090a8",
                }}
              >
                {onlineUserCount()} online
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg"
              style={{
                background:
                  "rgba(255,107,107,0.1)",
                color:
                  "#ff6b6b",
              }}
            >
              <LogOut
                size={16}
              />

              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================
          MOBILE MENU
      ====================================================== */}

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 top-[73px] lg:hidden"
          style={{
            background:
              "rgba(0,0,0,0.8)",
          }}
          onClick={() =>
            setMobileMenuOpen(
              false
            )
          }
        >
          <div
            className="bg-[#0d0d14] border-b p-3"
            style={{
              borderColor:
                "rgba(212,160,23,0.15)",
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {navigationItems.map(
              ({
                value,
                label,
                icon: IconComponent,
              }) => (
                <button
                  key={value}
                  onClick={() => {
                    setActiveSection(
                      value
                    );

                    setMobileMenuOpen(
                      false
                    );
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-sm font-bold rounded-lg"
                  style={{
                    background:
                      activeSection ===
                        value
                        ? "rgba(212,160,23,0.15)"
                        : "transparent",

                    color:
                      activeSection ===
                        value
                        ? "#d4a017"
                        : "#9090a8",
                  }}
                >
                  <IconComponent
                    size={18}
                  />

                  <span>
                    {label}
                  </span>

                  {value ===
                    "notifications" &&
                    notifications.filter(
                      (n) =>
                        !n.read
                    ).length >
                    0 && (
                      <span
                        className="ml-auto min-w-5 h-5 px-1 flex items-center justify-center rounded-full text-[10px] font-black"
                        style={{
                          background:
                            "#d4a017",
                          color:
                            "#09090e",
                        }}
                      >
                        {
                          notifications.filter(
                            (n) =>
                              !n.read
                          ).length
                        }
                      </span>
                    )}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="min-h-screen lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

          {/* ALERTS */}

          {message && (
            <div
              className="mb-6 p-4 border rounded-lg"
              style={{
                background:
                  "rgba(50,180,100,0.08)",
                borderColor:
                  "rgba(50,180,100,0.3)",
                color:
                  "#71d69a",
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              className="mb-6 p-4 border rounded-lg"
              style={{
                background:
                  "rgba(255,70,70,0.08)",
                borderColor:
                  "rgba(255,70,70,0.3)",
                color:
                  "#ff8b8b",
              }}
            >
              {error}
            </div>
          )}

          {/* ==================================================
              OVERVIEW
          ================================================== */}

          {activeSection ===
            "overview" &&
            stats && (
              <div>
                <div className="mb-8">
                  <p
                    className="text-xs uppercase tracking-widest font-bold mb-2"
                    style={{
                      color:
                        "#d4a017",
                    }}
                  >
                    Administration
                  </p>

                  <h2 className="text-3xl font-black">
                    Platform Overview
                  </h2>

                  <p
                    className="mt-2 text-sm"
                    style={{
                      color:
                        "#9090a8",
                    }}
                  >
                    Monitor users, balances, deposits,
                    withdrawals and platform activity.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                  <StatCard
                    title="Total Users"
                    value={
                      stats.total_users
                    }
                    icon={
                      <Users
                        size={20}
                      />
                    }
                  />

                  <StatCard
                    title="Active Users"
                    value={
                      stats.active_users
                    }
                    icon={
                      <Activity
                        size={20}
                      />
                    }
                  />

                  <StatCard
                    title="Online Users"
                    value={
                      onlineUserCount()
                    }
                    icon={
                      <Activity
                        size={20}
                      />
                    }
                  />

                  <StatCard
                    title="Pending Deposits"
                    value={
                      stats.pending_deposits
                    }
                    icon={
                      <CreditCard
                        size={20}
                      />
                    }
                  />

                  <StatCard
                    title="Confirmed Deposits"
                    value={
                      stats.confirmed_deposits
                    }
                    icon={
                      <CircleDollarSign
                        size={20}
                      />
                    }
                  />

                  <StatCard
                    title="Available Balance"
                    value={`$${formatMoney(
                      stats.total_available_balance
                    )}`}
                    icon={
                      <Wallet
                        size={20}
                      />
                    }
                  />

                  <StatCard
                    title="Invested Balance"
                    value={`$${formatMoney(
                      stats.total_invested_balance
                    )}`}
                    icon={
                      <Wallet
                        size={20}
                      />
                    }
                  />

                  <StatCard
                    title="Total Profit"
                    value={`$${formatMoney(
                      stats.total_profit
                    )}`}
                    icon={
                      <CircleDollarSign
                        size={20}
                      />
                    }
                  />

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-8">

                  <QuickCard
                    title="Pending Deposits"
                    value={
                      stats.pending_deposits
                    }
                    description="Deposits waiting for administrator review."
                    action={() =>
                      setActiveSection(
                        "deposits"
                      )
                    }
                    button="Review Deposits"
                  />

                  <QuickCard
                    title="Withdrawals"
                    value={
                      withdrawals.filter(
                        (w) =>
                          w.status ===
                          "PENDING"
                      ).length
                    }
                    description="Withdrawal requests waiting for processing."
                    action={() =>
                      setActiveSection(
                        "withdrawals"
                      )
                    }
                    button="Review Withdrawals"
                  />

                  <QuickCard
                    title="Notifications"
                    value={
                      notifications.filter(
                        (n) =>
                          !n.read
                      ).length
                    }
                    description="View sent notifications and send new messages."
                    action={() =>
                      setActiveSection(
                        "notifications"
                      )
                    }
                    button="Manage Notifications"
                  />

                </div>
              </div>
            )}

          {/* ==================================================
              USERS
          ================================================== */}

          {activeSection ===
            "users" && (
              <div>

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-6">
                  <div>
                    <h2 className="text-3xl font-black">
                      User Management
                    </h2>

                    <p
                      className="mt-2 text-sm"
                      style={{
                        color:
                          "#9090a8",
                      }}
                    >
                      Manage accounts, statuses,
                      balances and online activity.
                    </p>
                  </div>

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search users..."
                    className="px-4 py-3 border outline-none w-full md:w-80"
                    style={{
                      background:
                        "#111118",
                      borderColor:
                        "rgba(255,255,255,0.1)",
                      color:
                        "#f5f0e8",
                    }}
                  />
                </div>

                <div
                  className="border overflow-hidden rounded-lg"
                  style={{
                    background:
                      "#111118",
                    borderColor:
                      "rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-sm">

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
                            Online
                          </th>

                          <th className="p-5">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredUsers().map(
                          (user) => {
                            const name =
                              getUserName(
                                user
                              );

                            const online =
                              isUserOnline(
                                user.id
                              );

                            return (
                              <tr
                                key={
                                  user.id
                                }
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
                                        color:
                                          "#d4a017",
                                      }}
                                    >
                                      Administrator
                                    </span>
                                  )}
                                </td>

                                <td className="p-5">
                                  <div>
                                    {user.email ||
                                      "—"}
                                  </div>

                                  <div
                                    className="text-xs mt-1"
                                    style={{
                                      color:
                                        "#9090a8",
                                    }}
                                  >
                                    {user.phone ||
                                      "No phone"}

                                    {user.country
                                      ? ` • ${user.country}`
                                      : ""}
                                  </div>
                                </td>

                                <td className="p-5">
                                  <StatusBadge
                                    status={
                                      user.status
                                    }
                                  />
                                </td>

                                <td className="p-5 font-bold whitespace-nowrap">
                                  $
                                  {formatMoney(
                                    user.available_balance
                                  )}
                                </td>

                                <td className="p-5 whitespace-nowrap">
                                  $
                                  {formatMoney(
                                    user.invested_balance
                                  )}
                                </td>

                                <td className="p-5">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{
                                        background:
                                          online
                                            ? "#5dcc8a"
                                            : "#555",
                                        boxShadow:
                                          online
                                            ? "0 0 7px rgba(93,204,138,0.7)"
                                            : "none",
                                      }}
                                    />

                                    <span
                                      className="text-xs font-bold"
                                      style={{
                                        color:
                                          online
                                            ? "#71d69a"
                                            : "#777789",
                                      }}
                                    >
                                      {online
                                        ? "ONLINE"
                                        : "OFFLINE"}
                                    </span>
                                  </div>
                                </td>

                                <td className="p-5">
                                  <div className="flex flex-wrap gap-2">

                                    {!user.is_admin && (
                                      <button
                                        disabled={
                                          !!processing
                                        }
                                        onClick={() =>
                                          setBalanceModal(
                                            user
                                          )
                                        }
                                        className="px-3 py-2 text-xs font-bold"
                                        style={{
                                          background:
                                            "#d4a017",
                                          color:
                                            "#09090e",
                                        }}
                                      >
                                        Adjust Balance
                                      </button>
                                    )}

                                    {!user.is_admin &&
                                      user.status !==
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

                                    {!user.is_admin &&
                                      user.status !==
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

                                    {!user.is_admin &&
                                      user.status !==
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

                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>

                    </table>
                  </div>
                </div>
              </div>
            )}

          {/* ==================================================
              DEPOSITS
          ================================================== */}

          {activeSection ===
            "deposits" && (
              <div>

                <div className="mb-6">
                  <h2 className="text-3xl font-black">
                    Deposit Management
                  </h2>

                  <p
                    className="mt-2"
                    style={{
                      color:
                        "#9090a8",
                    }}
                  >
                    Review and process pending deposits.
                  </p>
                </div>

                <div
                  className="border overflow-hidden rounded-lg"
                  style={{
                    background:
                      "#111118",
                    borderColor:
                      "rgba(255,255,255,0.08)",
                  }}
                >
                  {deposits.length ===
                    0 ? (
                    <div
                      className="p-16 text-center"
                      style={{
                        color:
                          "#9090a8",
                      }}
                    >
                      No pending deposits.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">

                      <table className="w-full min-w-[900px] text-sm">

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
                          {deposits.map(
                            (deposit) => {
                              const userName =
                                `${deposit.first_name ?? ""} ${deposit.last_name ?? ""
                                  }`.trim() ||
                                "Unknown User";

                              const busy =
                                processing ===
                                deposit.id;

                              return (
                                <tr
                                  key={
                                    deposit.id
                                  }
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
                                      {
                                        deposit.email
                                      }
                                    </div>
                                  </td>

                                  <td className="p-5 font-bold whitespace-nowrap">
                                    {
                                      deposit.currency
                                    }{" "}
                                    {formatMoney(
                                      deposit.amount
                                    )}
                                  </td>

                                  <td className="p-5">
                                    {
                                      deposit.provider
                                    }
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
                                            "#5dcc8a",
                                          color:
                                            "#09090e",
                                        }}
                                      >
                                        {busy
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
                                        className="px-4 py-2 text-xs font-bold"
                                        style={{
                                          background:
                                            "#e05050",
                                          color:
                                            "#fff",
                                        }}
                                      >
                                        Cancel
                                      </button>

                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>

                      </table>

                    </div>
                  )}
                </div>
              </div>
            )}

          {/* ==================================================
              WITHDRAWALS
          ================================================== */}

          {activeSection ===
            "withdrawals" && (
              <div>

                <div className="mb-6">
                  <h2 className="text-3xl font-black">
                    Withdrawal Management
                  </h2>

                  <p
                    className="mt-2"
                    style={{
                      color:
                        "#9090a8",
                    }}
                  >
                    Review, approve or reject user withdrawal requests.
                  </p>
                </div>

                <div
                  className="border overflow-hidden rounded-lg"
                  style={{
                    background:
                      "#111118",
                    borderColor:
                      "rgba(255,255,255,0.08)",
                  }}
                >
                  {withdrawals.length ===
                    0 ? (
                    <div
                      className="p-16 text-center"
                      style={{
                        color:
                          "#9090a8",
                      }}
                    >
                      No withdrawal records found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">

                      <table className="w-full min-w-[1000px] text-sm">

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
                              Destination
                            </th>

                            <th className="p-5">
                              Status
                            </th>

                            <th className="p-5">
                              Date
                            </th>

                            <th className="p-5">
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {withdrawals.map(
                            (withdrawal) => {
                              const name =
                                `${withdrawal.first_name ?? ""} ${withdrawal.last_name ?? ""
                                  }`.trim() ||
                                "Unnamed User";

                              const pending =
                                withdrawal.status ===
                                "PENDING";

                              const busy =
                                processing ===
                                withdrawal.id;

                              return (
                                <tr
                                  key={
                                    withdrawal.id
                                  }
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

                                    <div
                                      className="text-xs mt-1"
                                      style={{
                                        color:
                                          "#777789",
                                      }}
                                    >
                                      {
                                        withdrawal.email
                                      }
                                    </div>
                                  </td>

                                  <td className="p-5 font-bold whitespace-nowrap">
                                    {
                                      withdrawal.currency
                                    }{" "}
                                    {formatMoney(
                                      withdrawal.amount
                                    )}
                                  </td>

                                  <td
                                    className="p-5 max-w-sm"
                                    style={{
                                      color:
                                        "#c7c2b8",
                                    }}
                                  >
                                    <div className="break-words">
                                      {
                                        withdrawal.destination
                                      }
                                    </div>
                                  </td>

                                  <td className="p-5">
                                    <WithdrawalStatus
                                      status={
                                        withdrawal.status
                                      }
                                    />
                                  </td>

                                  <td
                                    className="p-5 whitespace-nowrap"
                                    style={{
                                      color:
                                        "#9090a8",
                                    }}
                                  >
                                    {new Date(
                                      withdrawal.created_at
                                    ).toLocaleString()}
                                  </td>

                                  <td className="p-5">
                                    {pending ? (
                                      <div className="flex gap-2">

                                        <button
                                          disabled={
                                            !!processing
                                          }
                                          onClick={() =>
                                            approveWithdrawal(
                                              withdrawal.id
                                            )
                                          }
                                          className="px-4 py-2 text-xs font-bold"
                                          style={{
                                            background:
                                              "#5dcc8a",
                                            color:
                                              "#09090e",
                                          }}
                                        >
                                          {busy
                                            ? "Processing..."
                                            : "Approve"}
                                        </button>

                                        <button
                                          disabled={
                                            !!processing
                                          }
                                          onClick={() =>
                                            rejectWithdrawal(
                                              withdrawal.id
                                            )
                                          }
                                          className="px-4 py-2 text-xs font-bold"
                                          style={{
                                            background:
                                              "#e05050",
                                            color:
                                              "#fff",
                                          }}
                                        >
                                          Reject
                                        </button>

                                      </div>
                                    ) : (
                                      <span
                                        className="text-xs"
                                        style={{
                                          color:
                                            "#777789",
                                        }}
                                      >
                                        Processed
                                      </span>
                                    )}
                                  </td>

                                </tr>
                              );
                            }
                          )}
                        </tbody>

                      </table>

                    </div>
                  )}
                </div>
              </div>
            )}

          {/* ==================================================
              NOTIFICATIONS
          ================================================== */}

          {activeSection ===
            "notifications" && (
              <div>

                <div className="mb-8">
                  <h2 className="text-3xl font-black">
                    Notifications
                  </h2>

                  <p
                    className="mt-2"
                    style={{
                      color:
                        "#9090a8",
                    }}
                  >
                    Send messages to users and view notification history.
                  </p>
                </div>

                {/* SEND NOTIFICATION */}

                <div
                  className="mb-8 border p-6 rounded-lg"
                  style={{
                    background:
                      "#111118",
                    borderColor:
                      "rgba(212,160,23,0.15)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 flex items-center justify-center rounded-lg"
                      style={{
                        background:
                          "rgba(212,160,23,0.1)",
                        color:
                          "#d4a017",
                      }}
                    >
                      <Bell
                        size={20}
                      />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold">
                        Send Notification
                      </h3>

                      <p
                        className="text-xs mt-1"
                        style={{
                          color:
                            "#777789",
                        }}
                      >
                        Send a message directly to a user's notification center.
                      </p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="mb-2 block text-sm font-semibold">
                      Select User
                    </label>

                    <select
                      value={
                        notificationUser?.id ??
                        ""
                      }
                      onChange={(e) => {
                        const selected =
                          users.find(
                            (user) =>
                              user.id ===
                              e.target.value
                          );

                        setNotificationUser(
                          selected ??
                          null
                        );
                      }}
                      className="w-full border px-4 py-3 outline-none"
                      style={{
                        background:
                          "#0d0d14",
                        color:
                          "#f5f0e8",
                        borderColor:
                          "rgba(212,160,23,0.2)",
                      }}
                    >
                      <option value="">
                        Select a user
                      </option>

                      {users
                        .filter(
                          (user) =>
                            !user.is_admin
                        )
                        .map(
                          (user) => (
                            <option
                              key={
                                user.id
                              }
                              value={
                                user.id
                              }
                            >
                              {getUserName(
                                user
                              )}
                              {user.email
                                ? ` — ${user.email}`
                                : ""}
                            </option>
                          )
                        )}
                    </select>
                  </div>

                  <div className="mb-5">
                    <label className="mb-2 block text-sm font-semibold">
                      Notification Title
                    </label>

                    <input
                      type="text"
                      value={
                        notificationTitle
                      }
                      onChange={(e) =>
                        setNotificationTitle(
                          e.target.value
                        )
                      }
                      placeholder="Enter notification title"
                      className="w-full border px-4 py-3 outline-none"
                      style={{
                        background:
                          "#0d0d14",
                        color:
                          "#f5f0e8",
                        borderColor:
                          "rgba(212,160,23,0.2)",
                      }}
                    />
                  </div>

                  <div className="mb-5">
                    <label className="mb-2 block text-sm font-semibold">
                      Message
                    </label>

                    <textarea
                      value={
                        notificationMessage
                      }
                      onChange={(e) =>
                        setNotificationMessage(
                          e.target.value
                        )
                      }
                      placeholder="Write your message to the user..."
                      rows={6}
                      className="w-full resize-y border px-4 py-3 outline-none"
                      style={{
                        background:
                          "#0d0d14",
                        color:
                          "#f5f0e8",
                        borderColor:
                          "rgba(212,160,23,0.2)",
                      }}
                    />
                  </div>

                  {notificationUser && (
                    <div
                      className="mb-5 p-4 border"
                      style={{
                        background:
                          "rgba(212,160,23,0.05)",
                        borderColor:
                          "rgba(212,160,23,0.15)",
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{
                          color:
                            "#9090a8",
                        }}
                      >
                        Sending to
                      </p>

                      <p className="font-bold mt-1">
                        {getUserName(
                          notificationUser
                        )}
                      </p>

                      <p
                        className="text-xs mt-1"
                        style={{
                          color:
                            "#777789",
                        }}
                      >
                        {
                          notificationUser.email
                        }
                      </p>
                    </div>
                  )}

                  <button
                    onClick={
                      sendNotification
                    }
                    disabled={
                      sendingNotification
                    }
                    className="px-6 py-3 font-bold"
                    style={{
                      background:
                        sendingNotification
                          ? "#555"
                          : "#d4a017",
                      color:
                        "#09090e",
                      cursor:
                        sendingNotification
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {sendingNotification
                      ? "Sending..."
                      : "Send Notification"}
                  </button>
                </div>

                {/* HISTORY */}

                <div>
                  <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                    <div>
                      <h3 className="text-2xl font-black">
                        Notification History
                      </h3>

                      <p
                        className="mt-1 text-sm"
                        style={{
                          color:
                            "#9090a8",
                        }}
                      >
                        Previously sent notifications.
                      </p>
                    </div>

                    <button
                      onClick={
                        loadNotifications
                      }
                      className="border px-4 py-2 text-sm font-semibold"
                      style={{
                        borderColor:
                          "rgba(212,160,23,0.2)",
                        color:
                          "#d4a017",
                      }}
                    >
                      Refresh
                    </button>

                  </div>

                  {loadingNotifications ? (
                    <div
                      className="border p-8 text-center"
                      style={{
                        background:
                          "#111118",
                        borderColor:
                          "rgba(255,255,255,0.08)",
                        color:
                          "#9090a8",
                      }}
                    >
                      Loading notification history...
                    </div>
                  ) : notifications.length ===
                    0 ? (
                    <div
                      className="border p-8 text-center"
                      style={{
                        background:
                          "#111118",
                        borderColor:
                          "rgba(255,255,255,0.08)",
                        color:
                          "#9090a8",
                      }}
                    >
                      No notifications have been sent yet.
                    </div>
                  ) : (
                    <div
                      className="overflow-hidden border rounded-lg"
                      style={{
                        background:
                          "#111118",
                        borderColor:
                          "rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="overflow-x-auto">

                        <table className="w-full min-w-[850px] text-sm">

                          <thead>
                            <tr
                              className="border-b text-left"
                              style={{
                                borderColor:
                                  "rgba(255,255,255,0.08)",
                              }}
                            >
                              <th className="p-5">
                                User
                              </th>

                              <th className="p-5">
                                Notification
                              </th>

                              <th className="p-5">
                                Message
                              </th>

                              <th className="p-5">
                                Status
                              </th>

                              <th className="p-5">
                                Date
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {notifications.map(
                              (
                                notification
                              ) => (
                                <tr
                                  key={
                                    notification.id
                                  }
                                  className="border-b"
                                  style={{
                                    borderColor:
                                      "rgba(255,255,255,0.06)",
                                  }}
                                >

                                  <td className="p-5">
                                    <div className="font-bold">
                                      {
                                        notification.user_name
                                      }
                                    </div>

                                    <div
                                      className="mt-1 text-xs"
                                      style={{
                                        color:
                                          "#777789",
                                      }}
                                    >
                                      {
                                        notification.user_email
                                      }
                                    </div>
                                  </td>

                                  <td className="p-5">
                                    <div className="font-semibold">
                                      {
                                        notification.title
                                      }
                                    </div>
                                  </td>

                                  <td className="p-5 max-w-md">
                                    <p
                                      className="line-clamp-3"
                                      style={{
                                        color:
                                          "#9090a8",
                                      }}
                                    >
                                      {
                                        notification.message
                                      }
                                    </p>
                                  </td>

                                  <td className="p-5">
                                    <span
                                      className="inline-block px-3 py-1 text-xs font-bold"
                                      style={{
                                        background:
                                          notification.read
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(212,160,23,0.1)",

                                        color:
                                          notification.read
                                            ? "#9090a8"
                                            : "#d4a017",
                                      }}
                                    >
                                      {notification.read
                                        ? "READ"
                                        : "UNREAD"}
                                    </span>
                                  </td>

                                  <td
                                    className="whitespace-nowrap p-5"
                                    style={{
                                      color:
                                        "#9090a8",
                                    }}
                                  >
                                    {new Date(
                                      notification.created_at
                                    ).toLocaleString()}
                                  </td>

                                </tr>
                              )
                            )}
                          </tbody>

                        </table>

                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* ==================================================
              AUDIT HISTORY
          ================================================== */}

          {activeSection ===
            "audit" && (
              <div>

                <div className="mb-6">
                  <h2 className="text-3xl font-black">
                    Admin Audit History
                  </h2>

                  <p
                    className="mt-2"
                    style={{
                      color:
                        "#9090a8",
                    }}
                  >
                    Track administrator actions across the platform.
                  </p>
                </div>

                <div
                  className="border overflow-hidden rounded-lg"
                  style={{
                    background:
                      "#111118",
                    borderColor:
                      "rgba(255,255,255,0.08)",
                  }}
                >
                  {auditLogs.length ===
                    0 ? (
                    <div
                      className="p-16 text-center"
                      style={{
                        color:
                          "#9090a8",
                      }}
                    >
                      No administrative activity yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">

                      <table className="w-full min-w-[900px] text-sm">

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
                          {auditLogs.map(
                            (log) => (
                              <tr
                                key={
                                  log.id
                                }
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
                                  {log.amount !=
                                    null
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
                                        ([
                                          key,
                                          value,
                                        ]) =>
                                          `${key}: ${String(
                                            value
                                          )}`
                                      )
                                      .join(
                                        " • "
                                      )
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
                            )
                          )}
                        </tbody>

                      </table>

                    </div>
                  )}
                </div>
              </div>
            )}

        </div>
      </main>

      {/* ======================================================
          WALLET ADJUSTMENT MODAL
      ====================================================== */}

      {balanceModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{
            background:
              "rgba(0,0,0,0.75)",
          }}
        >
          <div
            className="w-full max-w-lg p-7 border rounded-lg"
            style={{
              background:
                "#111118",
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
                    color:
                      "#9090a8",
                  }}
                >
                  {getUserName(
                    balanceModal
                  )}
                </p>
              </div>

              <button
                onClick={() =>
                  setBalanceModal(
                    null
                  )
                }
                className="text-xl"
                style={{
                  color:
                    "#9090a8",
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
                  color:
                    "#9090a8",
                }}
              >
                Current Available Balance
              </p>

              <p
                className="text-2xl font-black mt-1"
                style={{
                  color:
                    "#d4a017",
                }}
              >
                $
                {formatMoney(
                  balanceModal.available_balance
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">

              <button
                onClick={() =>
                  setBalanceDirection(
                    "ADD"
                  )
                }
                className="p-4 border text-left"
                style={{
                  borderColor:
                    balanceDirection ===
                      "ADD"
                      ? "#d4a017"
                      : "rgba(255,255,255,0.1)",

                  background:
                    balanceDirection ===
                      "ADD"
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
                    color:
                      "#9090a8",
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
                    color:
                      "#9090a8",
                  }}
                >
                  Decrease balance
                </div>
              </button>

            </div>

            <label className="block text-sm font-bold mb-2">
              Amount
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={
                balanceAmount
              }
              onChange={(e) =>
                setBalanceAmount(
                  e.target.value
                )
              }
              placeholder="Enter amount"
              className="w-full px-4 py-3 border mb-5 outline-none"
              style={{
                background:
                  "#09090e",
                borderColor:
                  "rgba(255,255,255,0.1)",
                color:
                  "#f5f0e8",
              }}
            />

            <label className="block text-sm font-bold mb-2">
              Reason
            </label>

            <textarea
              value={
                balanceReason
              }
              onChange={(e) =>
                setBalanceReason(
                  e.target.value
                )
              }
              placeholder="Why is this adjustment being made?"
              rows={3}
              className="w-full px-4 py-3 border mb-6 outline-none resize-none"
              style={{
                background:
                  "#09090e",
                borderColor:
                  "rgba(255,255,255,0.1)",
                color:
                  "#f5f0e8",
              }}
            />

            {balanceDirection ===
              "SUBTRACT" && (
                <div
                  className="p-3 mb-5 text-xs border"
                  style={{
                    color:
                      "#ffb0b0",
                    borderColor:
                      "rgba(255,70,70,0.2)",
                    background:
                      "rgba(255,70,70,0.05)",
                  }}
                >
                  The database will prevent this adjustment if it would make the available balance negative.
                </div>
              )}

            <div className="flex gap-3">

              <button
                onClick={() => {
                  setBalanceModal(
                    null
                  );

                  setBalanceAmount(
                    ""
                  );

                  setBalanceReason(
                    ""
                  );
                }}
                className="flex-1 px-5 py-3 border font-bold"
                style={{
                  borderColor:
                    "rgba(255,255,255,0.1)",
                  color:
                    "#9090a8",
                }}
              >
                Cancel
              </button>

              <button
                onClick={
                  adjustBalance
                }
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
                  color:
                    "#09090e",
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

/*
 * ============================================================
 * STAT CARD
 * ============================================================
 */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="p-5 border rounded-lg"
      style={{
        background:
          "#111118",
        borderColor:
          "rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-start justify-between">

        <div>
          <p
            className="text-xs uppercase tracking-wider"
            style={{
              color:
                "#9090a8",
            }}
          >
            {title}
          </p>

          <p
            className="text-2xl font-black mt-3"
            style={{
              color:
                "#d4a017",
            }}
          >
            {value}
          </p>
        </div>

        <div
          className="w-10 h-10 flex items-center justify-center rounded-lg"
          style={{
            background:
              "rgba(212,160,23,0.08)",
            color:
              "#d4a017",
          }}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}

/*
 * ============================================================
 * QUICK CARD
 * ============================================================
 */

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
      className="p-6 border rounded-lg"
      style={{
        background:
          "#111118",
        borderColor:
          "rgba(255,255,255,0.08)",
      }}
    >
      <p
        className="text-sm"
        style={{
          color:
            "#9090a8",
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
          color:
            "#9090a8",
        }}
      >
        {description}
      </p>

      <button
        onClick={action}
        className="px-5 py-3 text-sm font-bold"
        style={{
          background:
            "#d4a017",
          color:
            "#09090e",
        }}
      >
        {button}
      </button>
    </div>
  );
}

/*
 * ============================================================
 * USER STATUS
 * ============================================================
 */

function StatusBadge({
  status,
}: {
  status: AccountStatus;
}) {
  const styles = {
    ACTIVE: {
      background:
        "rgba(50,180,100,0.1)",
      color:
        "#71d69a",
    },

    SUSPENDED: {
      background:
        "rgba(212,160,23,0.1)",
      color:
        "#d4a017",
    },

    DISABLED: {
      background:
        "rgba(220,70,70,0.1)",
      color:
        "#ff8b8b",
    },
  };

  const style =
    styles[status];

  return (
    <span
      className="inline-flex px-3 py-1 text-xs font-bold"
      style={style}
    >
      {status}
    </span>
  );
}

/*
 * ============================================================
 * WITHDRAWAL STATUS
 * ============================================================
 */

function WithdrawalStatus({
  status,
}: {
  status: string;
}) {
  const isPending =
    status === "PENDING";

  const isCompleted =
    status === "COMPLETED";

  return (
    <span
      className="inline-flex px-3 py-1 text-xs font-bold"
      style={{
        background:
          isPending
            ? "rgba(212,160,23,0.1)"
            : isCompleted
              ? "rgba(50,180,100,0.1)"
              : "rgba(255,70,70,0.1)",

        color:
          isPending
            ? "#d4a017"
            : isCompleted
              ? "#71d69a"
              : "#ff8b8b",
      }}
    >
      {status}
    </span>
  );
}
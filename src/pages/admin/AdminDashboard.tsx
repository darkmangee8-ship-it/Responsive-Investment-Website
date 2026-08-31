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
  Headphones,
  Trash2,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type AccountStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "DISABLED";

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

type SupportRequest = {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  subject: string;
  message: string;
  status:
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED";
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
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
  | "support"
  | "audit";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] =
    useState<Notification[]>([]);
  const [supportRequests, setSupportRequests] =
    useState<SupportRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const [onlineUsers, setOnlineUsers] =
    useState<OnlinePresence[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingNotifications, setLoadingNotifications] =
    useState(false);

  const [loadingSupport, setLoadingSupport] =
    useState(false);

  const [processing, setProcessing] =
    useState<string | null>(null);

  const [sendingNotification, setSendingNotification] =
    useState(false);

  const [replyingSupport, setReplyingSupport] =
    useState(false);

  const [deletingUser, setDeletingUser] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeSection, setActiveSection] =
    useState<Section>("overview");

  const [search, setSearch] =
    useState("");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  /*
   * ==========================================================
   * WALLET ADJUSTMENT
   * ==========================================================
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
   * ==========================================================
   * NOTIFICATION FORM
   * ==========================================================
   */

  const [notificationUser, setNotificationUser] =
    useState<User | null>(null);

  const [notificationTitle, setNotificationTitle] =
    useState("");

  const [notificationMessage, setNotificationMessage] =
    useState("");

  /*
   * ==========================================================
   * SUPPORT
   * ==========================================================
   */

  const [selectedSupport, setSelectedSupport] =
    useState<SupportRequest | null>(null);

  const [supportReply, setSupportReply] =
    useState("");

  const [supportStatus, setSupportStatus] =
    useState<
      "OPEN" | "IN_PROGRESS" | "RESOLVED"
    >("RESOLVED");

  /*
   * ==========================================================
   * DELETE USER
   * ==========================================================
   */

  const [deleteUserModal, setDeleteUserModal] =
    useState<User | null>(null);

  /*
   * ==========================================================
   * ADMIN CHECK
   * ==========================================================
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
   * ==========================================================
   * LOAD EVERYTHING
   * ==========================================================
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
      loadSupportRequests(),
    ]);
  }

  async function loadUsers() {
    const {
      data,
      error,
    } = await supabase.rpc("admin_get_users");

    if (error) {
      console.error("USERS ERROR:", error);
      setError(error.message);
      return;
    }

    setUsers((data ?? []) as User[]);
  }

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

  async function loadSupportRequests() {
    setLoadingSupport(true);

    const {
      data,
      error,
    } = await supabase.rpc(
      "admin_get_support_requests"
    );

    if (error) {
      console.error(
        "SUPPORT ERROR:",
        error
      );
      setError(error.message);
      setLoadingSupport(false);
      return;
    }

    setSupportRequests(
      (data ?? []) as SupportRequest[]
    );

    setLoadingSupport(false);
  }

  /*
   * ==========================================================
   * SEND NOTIFICATION
   * ==========================================================
   */

  async function sendNotification() {
    if (sendingNotification) return;

    setError("");
    setMessage("");

    if (!notificationUser) {
      setError("Please select a user.");
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
    } finally {
      setSendingNotification(false);
    }
  }

  /*
   * ==========================================================
   * DEPOSITS
   * ==========================================================
   */

  async function approveDeposit(
    depositId: string
  ) {
    if (processing) return;

    setProcessing(depositId);
    setError("");
    setMessage("");

    try {
      const { error } =
        await supabase.rpc(
          "approve_deposit",
          {
            p_deposit_id:
              depositId,
          }
        );

      if (error) {
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

  async function rejectDeposit(
    depositId: string
  ) {
    if (processing) return;

    setProcessing(depositId);
    setError("");
    setMessage("");

    try {
      const { error } =
        await supabase.rpc(
          "reject_deposit",
          {
            p_deposit_id:
              depositId,
          }
        );

      if (error) {
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
   * ==========================================================
   * WITHDRAWALS
   * ==========================================================
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
        setError(error.message);
        return;
      }

      setMessage(
        `Withdrawal of ${formatMoney(
          Number(data?.amount ?? 0)
        )} approved successfully.`
      );

      await loadAll();
    } finally {
      setProcessing(null);
    }
  }

  async function rejectWithdrawal(
    withdrawalId: string
  ) {
    if (processing) return;

    setProcessing(withdrawalId);
    setError("");
    setMessage("");

    try {
      const { error } =
        await supabase.rpc(
          "admin_reject_withdrawal",
          {
            p_withdrawal_id:
              withdrawalId,
          }
        );

      if (error) {
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
   * ==========================================================
   * USER STATUS
   * ==========================================================
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
      const { error } =
        await supabase.rpc(
          "admin_update_user_status",
          {
            p_user_id: user.id,
            p_status: status,
          }
        );

      if (error) {
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

  /*
   * ==========================================================
   * BALANCE
   * ==========================================================
   */

  async function adjustBalance() {
    if (!balanceModal) return;

    const amount =
      Number(balanceAmount);

    if (!amount || amount <= 0) {
      setError("Enter a valid amount.");
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
        setError(error.message);
        return;
      }

      setMessage(
        balanceDirection ===
          "ADD"
          ? `$${formatMoney(
            amount
          )} added successfully.`
          : `$${formatMoney(
            amount
          )} deducted successfully.`
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
   * ==========================================================
   * SUPPORT REPLY
   * ==========================================================
   */

  async function replyToSupport() {
    if (!selectedSupport) return;

    if (!supportReply.trim()) {
      setError(
        "Please enter a support reply."
      );
      return;
    }

    setReplyingSupport(true);
    setError("");
    setMessage("");

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "admin_reply_support_request",
        {
          p_request_id:
            selectedSupport.id,
          p_reply:
            supportReply.trim(),
          p_status:
            supportStatus,
        }
      );

      if (error) {
        console.error(
          "SUPPORT REPLY ERROR:",
          error
        );
        setError(error.message);
        return;
      }

      if (!data?.success) {
        setError(
          data?.message ??
          "Unable to send support reply."
        );
        return;
      }

      setMessage(
        "Support response sent successfully."
      );

      setSupportReply("");
      setSelectedSupport(null);

      await Promise.all([
        loadSupportRequests(),
        loadNotifications(),
      ]);
    } finally {
      setReplyingSupport(false);
    }
  }

  /*
   * ==========================================================
   * PERMANENT DELETE
   * ==========================================================
   *
   * This calls a secure Supabase Edge Function.
   *
   * DO NOT put service_role in the React app.
   * ==========================================================
   */

  async function permanentlyDeleteUser() {
    if (!deleteUserModal) return;

    if (deleteUserModal.is_admin) {
      setError(
        "Administrator accounts cannot be deleted from here."
      );
      return;
    }

    setDeletingUser(true);
    setError("");
    setMessage("");

    try {
      const {
        data,
        error,
      } = await supabase.functions.invoke(
        "admin-delete-user",
        {
          body: {
            user_id:
              deleteUserModal.id,
          },
        }
      );

      if (error) {
        console.error(
          "DELETE USER ERROR:",
          error
        );

        setError(
          error.message ||
          "Unable to permanently delete this user."
        );
        return;
      }

      if (!data?.success) {
        setError(
          data?.message ??
          "Unable to permanently delete this user."
        );
        return;
      }

      setMessage(
        `${getUserName(
          deleteUserModal
        )} was permanently deleted.`
      );

      setDeleteUserModal(null);

      await loadAll();
    } finally {
      setDeletingUser(false);
    }
  }

  /*
   * ==========================================================
   * PRESENCE
   * ==========================================================
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

      if (!user || cancelled) return;

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

      channel
        .on(
          "presence",
          { event: "sync" },
          updateOnlineUsers
        )
        .on(
          "presence",
          { event: "join" },
          updateOnlineUsers
        )
        .on(
          "presence",
          { event: "leave" },
          updateOnlineUsers
        )
        .subscribe((status) => {
          if (
            status ===
            "SUBSCRIBED"
          ) {
            updateOnlineUsers();
          }
        });
    }

    setupPresence();

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(
          channel
        );
      }
    };
  }, []);

  /*
   * ==========================================================
   * HELPERS
   * ==========================================================
   */

  function getUserName(user: User) {
    const name =
      `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

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

    if (!q) return users;

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

  function formatDate(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleString();
  }

  async function logout() {
    await supabase.auth.signOut();

    navigate("/login", {
      replace: true,
    });
  }

  /*
   * ==========================================================
   * NAVIGATION
   * ==========================================================
   */

  const navigationItems = [
    {
      value: "overview" as const,
      label: "Overview",
      icon: LayoutGrid,
    },
    {
      value: "users" as const,
      label: "Users",
      icon: Users,
    },
    {
      value: "deposits" as const,
      label: "Deposits",
      icon: CreditCard,
    },
    {
      value: "withdrawals" as const,
      label: "Withdrawals",
      icon: Wallet,
    },
    {
      value: "notifications" as const,
      label: "Notifications",
      icon: Bell,
    },
    {
      value: "support" as const,
      label: "Support",
      icon: Headphones,
    },
    {
      value: "audit" as const,
      label: "Audit History",
      icon: FileText,
    },
  ];

  const unreadNotifications =
    notifications.filter(
      (n) => !n.read
    ).length;

  const openSupportCount =
    supportRequests.filter(
      (request) =>
        request.status !==
        "RESOLVED"
    ).length;

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
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
            className="w-10 h-10 border-2 rounded-full animate-spin mx-auto mb-4"
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
              color:
                "#9090a8",
            }}
          >
            Loading administrator dashboard...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ==========================================================
   * ACCESS DENIED
   * ==========================================================
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
          background:
            "#09090e",
          color:
            "#f5f0e8",
        }}
      >
        <div
          className="w-full max-w-md p-8 border rounded-2xl"
          style={{
            background:
              "#111118",
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
              color:
                "#ff8b8b",
            }}
          >
            {error}
          </p>

          <button
            onClick={logout}
            className="mt-6 px-5 py-3 rounded-xl font-bold"
            style={{
              background:
                "#d4a017",
              color:
                "#09090e",
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
        background:
          "#09090e",
        color:
          "#f5f0e8",
      }}
    >

      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside
        className="fixed top-0 left-0 h-screen w-64 hidden lg:flex flex-col border-r z-40"
        style={{
          background:
            "#0d0d14",
          borderColor:
            "rgba(212,160,23,0.15)",
        }}
      >
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

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          {navigationItems.map(
            ({
              value,
              label,
              icon: Icon,
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
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all"
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
                <Icon
                  size={18}
                  strokeWidth={1.8}
                />

                <span>
                  {label}
                </span>

                {value ===
                  "notifications" &&
                  unreadNotifications >
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
                      {unreadNotifications}
                    </span>
                  )}

                {value ===
                  "support" &&
                  openSupportCount >
                  0 && (
                    <span
                      className="ml-auto min-w-5 h-5 px-1 flex items-center justify-center rounded-full text-[10px] font-black"
                      style={{
                        background:
                          "#5dcca8",
                        color:
                          "#09090e",
                      }}
                    >
                      {openSupportCount}
                    </span>
                  )}
              </button>
            )
          )}
        </nav>

        <div
          className="mx-4 mb-4 p-4 border rounded-xl"
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

        <div
          className="border-t p-4"
          style={{
            borderColor:
              "rgba(212,160,23,0.15)",
          }}
        >
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl"
            style={{
              color:
                "#ff6b6b",
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* =====================================================
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
              className="lg:hidden p-2.5 rounded-xl"
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
                <Menu size={20} />
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl"
              style={{
                background:
                  "rgba(255,107,107,0.1)",
                color:
                  "#ff6b6b",
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>

          </div>

        </div>
      </header>

      {/* =====================================================
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
                icon: Icon,
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
                  className="w-full flex items-center gap-3 px-4 py-4 text-sm font-bold rounded-xl"
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
                  <Icon size={18} />

                  <span>
                    {label}
                  </span>

                  {value ===
                    "notifications" &&
                    unreadNotifications >
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
                        {unreadNotifications}
                      </span>
                    )}

                  {value ===
                    "support" &&
                    openSupportCount >
                    0 && (
                      <span
                        className="ml-auto min-w-5 h-5 px-1 flex items-center justify-center rounded-full text-[10px] font-black"
                        style={{
                          background:
                            "#5dcc8a",
                          color:
                            "#09090e",
                        }}
                      >
                        {openSupportCount}
                      </span>
                    )}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="min-h-screen lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

          {/* ALERTS */}

          {message && (
            <div
              className="mb-6 p-4 border rounded-xl"
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
              className="mb-6 p-4 border rounded-xl"
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
                      <Users size={20} />
                    }
                  />

                  <StatCard
                    title="Active Users"
                    value={
                      stats.active_users
                    }
                    icon={
                      <Activity size={20} />
                    }
                  />

                  <StatCard
                    title="Online Users"
                    value={
                      onlineUserCount()
                    }
                    icon={
                      <Activity size={20} />
                    }
                  />

                  <StatCard
                    title="Pending Deposits"
                    value={
                      stats.pending_deposits
                    }
                    icon={
                      <CreditCard size={20} />
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
                      <Wallet size={20} />
                    }
                  />

                  <StatCard
                    title="Invested Balance"
                    value={`$${formatMoney(
                      stats.total_invested_balance
                    )}`}
                    icon={
                      <Wallet size={20} />
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

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mt-8">

                  <QuickCard
                    title="Deposits"
                    value={
                      stats.pending_deposits
                    }
                    description="Pending deposits."
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
                    description="Requests awaiting review."
                    action={() =>
                      setActiveSection(
                        "withdrawals"
                      )
                    }
                    button="Review Withdrawals"
                  />

                  <QuickCard
                    title="Support"
                    value={
                      openSupportCount
                    }
                    description="Open support requests."
                    action={() =>
                      setActiveSection(
                        "support"
                      )
                    }
                    button="Open Support"
                  />

                  <QuickCard
                    title="Notifications"
                    value={
                      unreadNotifications
                    }
                    description="Unread notifications."
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
                    className="px-4 py-3 border outline-none w-full md:w-80 rounded-xl"
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
                  className="border overflow-hidden rounded-xl"
                  style={{
                    background:
                      "#111118",
                    borderColor:
                      "rgba(255,255,255,0.08)",
                  }}
                >

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[1250px] text-sm">

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
                                    {getUserName(
                                      user
                                    )}
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
                                    {
                                      user.email
                                    }
                                  </div>

                                  <div
                                    className="text-xs mt-1"
                                    style={{
                                      color:
                                        "#9090a8",
                                    }}
                                  >
                                    {
                                      user.phone
                                    }
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

                                <td className="p-5 font-bold">
                                  $
                                  {formatMoney(
                                    user.available_balance
                                  )}
                                </td>

                                <td className="p-5">
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

                                  {!user.is_admin && (
                                    <div className="flex flex-wrap gap-2">

                                      <button
                                        disabled={
                                          !!processing
                                        }
                                        onClick={() =>
                                          setBalanceModal(
                                            user
                                          )
                                        }
                                        className="px-3 py-2 text-xs font-bold rounded-lg"
                                        style={{
                                          background:
                                            "#d4a017",
                                          color:
                                            "#09090e",
                                        }}
                                      >
                                        Adjust Balance
                                      </button>

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
                                            className="px-3 py-2 text-xs font-bold border rounded-lg"
                                            style={{
                                              color:
                                                "#71d69a",
                                              borderColor:
                                                "rgba(50,180,100,0.3)",
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
                                            className="px-3 py-2 text-xs font-bold border rounded-lg"
                                            style={{
                                              color:
                                                "#d4a017",
                                              borderColor:
                                                "rgba(212,160,23,0.3)",
                                            }}
                                          >
                                            Suspend
                                          </button>
                                        )}

                                      <button
                                        disabled={
                                          !!processing ||
                                          deletingUser
                                        }
                                        onClick={() =>
                                          setDeleteUserModal(
                                            user
                                          )
                                        }
                                        className="px-3 py-2 text-xs font-bold border rounded-lg flex items-center gap-1.5"
                                        style={{
                                          color:
                                            "#ff8b8b",
                                          borderColor:
                                            "rgba(255,70,70,0.25)",
                                        }}
                                      >
                                        <Trash2
                                          size={13}
                                        />
                                        Delete
                                      </button>

                                    </div>
                                  )}

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
                    className="mt-2 text-sm"
                    style={{
                      color:
                        "#9090a8",
                    }}
                  >
                    Review and process pending deposits.
                  </p>
                </div>

                <div
                  className="border overflow-hidden rounded-xl"
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
                                `${deposit.first_name ?? ""} ${deposit.last_name ?? ""}`.trim() ||
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
                                      {
                                        userName
                                      }
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

                                  <td className="p-5 font-bold">
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
                                    {
                                      deposit.provider_reference
                                    }
                                  </td>

                                  <td
                                    className="p-5 whitespace-nowrap"
                                    style={{
                                      color:
                                        "#9090a8",
                                    }}
                                  >
                                    {formatDate(
                                      deposit.created_at
                                    )}
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
                                        className="px-4 py-2 text-xs font-bold rounded-lg"
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
                                        className="px-4 py-2 text-xs font-bold rounded-lg"
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
                    className="mt-2 text-sm"
                    style={{
                      color:
                        "#9090a8",
                    }}
                  >
                    Review, approve or reject withdrawal requests.
                  </p>
                </div>

                <div
                  className="border overflow-hidden rounded-xl"
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
                                `${withdrawal.first_name ?? ""} ${withdrawal.last_name ?? ""}`.trim() ||
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

                                  <td className="p-5 font-bold">
                                    {
                                      withdrawal.currency
                                    }{" "}
                                    {formatMoney(
                                      withdrawal.amount
                                    )}
                                  </td>

                                  <td className="p-5 max-w-xs">
                                    {
                                      withdrawal.destination
                                    }
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
                                    {formatDate(
                                      withdrawal.created_at
                                    )}
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
                                          className="px-4 py-2 text-xs font-bold rounded-lg"
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
                                          className="px-4 py-2 text-xs font-bold rounded-lg"
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
                    className="mt-2 text-sm"
                    style={{
                      color:
                        "#9090a8",
                    }}
                  >
                    Send messages to users and view notification history.
                  </p>
                </div>

                <div
                  className="mb-8 border p-6 rounded-xl"
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
                      <Bell size={20} />
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
                      className="w-full border px-4 py-3 outline-none rounded-xl"
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
                      className="w-full border px-4 py-3 outline-none rounded-xl"
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
                      className="w-full resize-y border px-4 py-3 outline-none rounded-xl"
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

                  <button
                    onClick={
                      sendNotification
                    }
                    disabled={
                      sendingNotification
                    }
                    className="px-6 py-3 font-bold rounded-xl"
                    style={{
                      background:
                        sendingNotification
                          ? "#555"
                          : "#d4a017",
                      color:
                        "#09090e",
                    }}
                  >
                    {sendingNotification
                      ? "Sending..."
                      : "Send Notification"}
                  </button>

                </div>

                <div>

                  <div className="flex items-center justify-between mb-5">
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
                      className="border px-4 py-2 text-sm font-semibold rounded-lg"
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
                      className="border p-8 text-center rounded-xl"
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
                  ) : (
                    <div
                      className="border overflow-hidden rounded-xl"
                      style={{
                        background:
                          "#111118",
                        borderColor:
                          "rgba(255,255,255,0.08)",
                      }}
                    >

                      {notifications.length ===
                        0 ? (
                        <div
                          className="p-8 text-center"
                          style={{
                            color:
                              "#9090a8",
                          }}
                        >
                          No notifications sent yet.
                        </div>
                      ) : (
                        notifications.map(
                          (notification) => (
                            <div
                              key={
                                notification.id
                              }
                              className="p-5 border-b"
                              style={{
                                borderColor:
                                  "rgba(255,255,255,0.06)",
                              }}
                            >
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">

                                <div>
                                  <p className="font-bold">
                                    {
                                      notification.title
                                    }
                                  </p>

                                  <p
                                    className="text-xs mt-1"
                                    style={{
                                      color:
                                        "#777789",
                                    }}
                                  >
                                    {
                                      notification.user_name
                                    }
                                    {" • "}
                                    {
                                      notification.user_email
                                    }
                                  </p>
                                </div>

                                <span
                                  className="self-start px-3 py-1 text-[10px] font-bold"
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

                              </div>

                              <p
                                className="text-sm mt-3 leading-6"
                                style={{
                                  color:
                                    "#a7a3a0",
                                }}
                              >
                                {
                                  notification.message
                                }
                              </p>

                              <p
                                className="text-xs mt-3"
                                style={{
                                  color:
                                    "#666678",
                                }}
                              >
                                {formatDate(
                                  notification.created_at
                                )}
                              </p>
                            </div>
                          )
                        )
                      )}

                    </div>
                  )}

                </div>
              </div>
            )}

          {/* ==================================================
              SUPPORT
          ================================================== */}

          {activeSection ===
            "support" && (
              <div>

                <div className="mb-8">
                  <div className="flex items-center gap-3">

                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background:
                          "rgba(93,204,138,0.08)",
                        color:
                          "#5dcc8a",
                      }}
                    >
                      <Headphones
                        size={22}
                      />
                    </div>

                    <div>
                      <h2 className="text-3xl font-black">
                        Support Inbox
                      </h2>

                      <p
                        className="mt-1 text-sm"
                        style={{
                          color:
                            "#9090a8",
                        }}
                      >
                        Read user problems and respond directly from the admin panel.
                      </p>
                    </div>

                  </div>
                </div>

                {loadingSupport ? (
                  <div
                    className="p-10 border rounded-xl text-center"
                    style={{
                      background:
                        "#111118",
                      borderColor:
                        "rgba(255,255,255,0.08)",
                      color:
                        "#9090a8",
                    }}
                  >
                    Loading support requests...
                  </div>
                ) : supportRequests.length ===
                  0 ? (
                  <div
                    className="p-12 border rounded-xl text-center"
                    style={{
                      background:
                        "#111118",
                      borderColor:
                        "rgba(255,255,255,0.08)",
                    }}
                  >
                    <MessageSquare
                      size={38}
                      className="mx-auto"
                      style={{
                        color:
                          "#d4a017",
                      }}
                    />

                    <h3 className="mt-4 font-bold text-xl">
                      No support requests
                    </h3>

                    <p
                      className="mt-2 text-sm"
                      style={{
                        color:
                          "#9090a8",
                      }}
                    >
                      New user support messages will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">

                    {supportRequests.map(
                      (request) => (
                        <div
                          key={
                            request.id
                          }
                          className="border rounded-xl p-5"
                          style={{
                            background:
                              "#111118",
                            borderColor:
                              "rgba(255,255,255,0.08)",
                          }}
                        >

                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                            <div className="flex-1">

                              <div className="flex flex-wrap items-center gap-3">

                                <h3 className="text-lg font-bold">
                                  {
                                    request.subject
                                  }
                                </h3>

                                <SupportStatusBadge
                                  status={
                                    request.status
                                  }
                                />

                              </div>

                              <div className="mt-2 text-xs">
                                <span
                                  style={{
                                    color:
                                      "#d4a017",
                                  }}
                                >
                                  {
                                    request.user_name ||
                                    "Unknown User"
                                  }
                                </span>

                                <span
                                  style={{
                                    color:
                                      "#666678",
                                  }}
                                >
                                  {" • "}
                                </span>

                                <span
                                  style={{
                                    color:
                                      "#777789",
                                  }}
                                >
                                  {
                                    request.user_email
                                  }
                                </span>
                              </div>

                              <p
                                className="mt-4 text-sm leading-7"
                                style={{
                                  color:
                                    "#c4c0bb",
                                }}
                              >
                                {
                                  request.message
                                }
                              </p>

                              <p
                                className="mt-3 text-xs"
                                style={{
                                  color:
                                    "#666678",
                                }}
                              >
                                Submitted{" "}
                                {formatDate(
                                  request.created_at
                                )}
                              </p>

                              {request.admin_reply && (
                                <div
                                  className="mt-5 p-4 border rounded-xl"
                                  style={{
                                    background:
                                      "rgba(93,204,138,0.04)",
                                    borderColor:
                                      "rgba(93,204,138,0.15)",
                                  }}
                                >
                                  <p
                                    className="text-xs uppercase tracking-wider font-bold mb-2"
                                    style={{
                                      color:
                                        "#5dcc8a",
                                    }}
                                  >
                                    Previous reply
                                  </p>

                                  <p
                                    className="text-sm leading-6"
                                    style={{
                                      color:
                                        "#c4c0bb",
                                    }}
                                  >
                                    {
                                      request.admin_reply
                                    }
                                  </p>
                                </div>
                              )}

                            </div>

                            <button
                              onClick={() => {
                                setSelectedSupport(
                                  request
                                );
                                setSupportReply(
                                  request.admin_reply ??
                                  ""
                                );
                                setSupportStatus(
                                  request.status ===
                                    "RESOLVED"
                                    ? "RESOLVED"
                                    : "IN_PROGRESS"
                                );
                              }}
                              className="px-5 py-3 font-bold rounded-xl flex items-center justify-center gap-2"
                              style={{
                                background:
                                  "#d4a017",
                                color:
                                  "#09090e",
                              }}
                            >
                              <MessageSquare
                                size={17}
                              />
                              {request.admin_reply
                                ? "Reply Again"
                                : "Reply"}
                            </button>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>
            )}

          {/* ==================================================
              AUDIT
          ================================================== */}

          {activeSection ===
            "audit" && (
              <div>

                <div className="mb-6">
                  <h2 className="text-3xl font-black">
                    Admin Audit History
                  </h2>

                  <p
                    className="mt-2 text-sm"
                    style={{
                      color:
                        "#9090a8",
                    }}
                  >
                    Track administrator actions across the platform.
                  </p>
                </div>

                <div
                  className="border overflow-hidden rounded-xl"
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
                                  {
                                    log.admin_name
                                  }
                                </td>

                                <td className="p-5">
                                  {
                                    log.target_user_name ||
                                    "—"
                                  }
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
                                  {formatDate(
                                    log.created_at
                                  )}
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

      {/* =====================================================
          BALANCE MODAL
      ====================================================== */}

      {balanceModal && (
        <ModalShell
          onClose={() => {
            setBalanceModal(
              null
            );
            setBalanceAmount("");
            setBalanceReason("");
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
                )}
              style={{
                color:
                  "#9090a8",
              }}
            >
              <X />
            </button>

          </div>

          <div
            className="p-4 mb-5 rounded-xl"
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
              className="p-4 border rounded-xl text-left"
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
              <strong>+ Add Funds</strong>
            </button>

            <button
              onClick={() =>
                setBalanceDirection(
                  "SUBTRACT"
                )
              }
              className="p-4 border rounded-xl text-left"
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
              <strong>− Reduce Funds</strong>
            </button>

          </div>

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
            placeholder="Amount"
            className="w-full px-4 py-3 border outline-none mb-4 rounded-xl"
            style={{
              background:
                "#09090e",
              color:
                "#f5f0e8",
              borderColor:
                "rgba(255,255,255,0.1)",
            }}
          />

          <textarea
            value={balanceReason}
            onChange={(e) =>
              setBalanceReason(
                e.target.value
              )
            }
            placeholder="Reason"
            rows={4}
            className="w-full px-4 py-3 border outline-none resize-none rounded-xl mb-6"
            style={{
              background:
                "#09090e",
              color:
                "#f5f0e8",
              borderColor:
                "rgba(255,255,255,0.1)",
            }}
          />

          <div className="flex gap-3">

            <button
              onClick={() =>
                setBalanceModal(
                  null
                )
              }
              className="flex-1 py-3 border rounded-xl font-bold"
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
              className="flex-1 py-3 rounded-xl font-bold"
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
              {balanceDirection ===
                "ADD"
                ? "Add Funds"
                : "Reduce Funds"}
            </button>

          </div>
        </ModalShell>
      )}

      {/* =====================================================
          SUPPORT REPLY MODAL
      ====================================================== */}

      {selectedSupport && (
        <ModalShell
          onClose={() =>
            setSelectedSupport(
              null
            )
          }
        >
          <div className="flex items-start justify-between gap-4 mb-6">

            <div>
              <p
                className="text-xs uppercase tracking-widest font-bold"
                style={{
                  color:
                    "#d4a017",
                }}
              >
                Support Request
              </p>

              <h2 className="text-2xl font-black mt-2">
                {selectedSupport.subject}
              </h2>

              <p
                className="text-xs mt-2"
                style={{
                  color:
                    "#777789",
                }}
              >
                {selectedSupport.user_name ||
                  "Unknown User"}
                {" • "}
                {selectedSupport.user_email}
              </p>
            </div>

            <button
              onClick={() =>
                setSelectedSupport(
                  null
                )
              }
              style={{
                color:
                  "#9090a8",
              }}
            >
              <X />
            </button>

          </div>

          <div
            className="p-4 rounded-xl mb-5"
            style={{
              background:
                "#0d0d14",
            }}
          >
            <p
              className="text-xs uppercase tracking-wider mb-2"
              style={{
                color:
                  "#666678",
              }}
            >
              User Message
            </p>

            <p
              className="text-sm leading-7 whitespace-pre-wrap"
              style={{
                color:
                  "#c7c2b8",
              }}
            >
              {
                selectedSupport.message
              }
            </p>
          </div>

          <label className="block text-sm font-bold mb-2">
            Status
          </label>

          <select
            value={supportStatus}
            onChange={(e) =>
              setSupportStatus(
                e.target.value as
                | "OPEN"
                | "IN_PROGRESS"
                | "RESOLVED"
              )
            }
            className="w-full px-4 py-3 border outline-none rounded-xl mb-5"
            style={{
              background:
                "#09090e",
              color:
                "#f5f0e8",
              borderColor:
                "rgba(255,255,255,0.1)",
            }}
          >
            <option value="OPEN">
              Open
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="RESOLVED">
              Resolved
            </option>
          </select>

          <label className="block text-sm font-bold mb-2">
            Reply
          </label>

          <textarea
            value={supportReply}
            onChange={(e) =>
              setSupportReply(
                e.target.value
              )
            }
            rows={6}
            placeholder="Write your response to the user..."
            className="w-full px-4 py-3 border outline-none resize-none rounded-xl"
            style={{
              background:
                "#09090e",
              color:
                "#f5f0e8",
              borderColor:
                "rgba(212,160,23,0.2)",
            }}
          />

          <button
            onClick={
              replyToSupport
            }
            disabled={
              replyingSupport
            }
            className="w-full mt-5 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
            style={{
              background:
                replyingSupport
                  ? "#555"
                  : "#d4a017",
              color:
                "#09090e",
            }}
          >
            <MessageSquare
              size={18}
            />

            {replyingSupport
              ? "Sending..."
              : "Send Reply"}
          </button>
        </ModalShell>
      )}

      {/* =====================================================
          DELETE USER CONFIRMATION
      ====================================================== */}

      {deleteUserModal && (
        <ModalShell
          onClose={() =>
            setDeleteUserModal(
              null
            )
          }
        >
          <div className="text-center">

            <div
              className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "rgba(255,70,70,0.1)",
                color:
                  "#ff8b8b",
              }}
            >
              <AlertTriangle
                size={28}
              />
            </div>

            <h2 className="text-2xl font-black mt-5">
              Delete User Permanently?
            </h2>

            <p
              className="mt-3 text-sm leading-6"
              style={{
                color:
                  "#9090a8",
              }}
            >
              You are about to permanently delete{" "}
              <strong
                style={{
                  color:
                    "#f5f0e8",
                }}
              >
                {getUserName(
                  deleteUserModal
                )}
              </strong>
              .
            </p>

            <p
              className="mt-3 text-sm leading-6"
              style={{
                color:
                  "#ff8b8b",
              }}
            >
              This action is irreversible. The user's account
              and associated records will be permanently removed.
            </p>

            <div className="flex gap-3 mt-7">

              <button
                onClick={() =>
                  setDeleteUserModal(
                    null
                  )
                }
                className="flex-1 py-3 border rounded-xl font-bold"
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
                  permanentlyDeleteUser
                }
                disabled={
                  deletingUser
                }
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{
                  background:
                    "#e05050",
                  color:
                    "#fff",
                }}
              >
                <Trash2
                  size={17}
                />

                {deletingUser
                  ? "Deleting..."
                  : "Delete Permanently"}
              </button>

            </div>

          </div>
        </ModalShell>
      )}

    </div>
  );
}

/*
 * ============================================================
 * MODAL SHELL
 * ============================================================
 */

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5"
      style={{
        background:
          "rgba(0,0,0,0.78)",
        backdropFilter:
          "blur(7px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border"
        style={{
          background:
            "#111118",
          borderColor:
            "rgba(212,160,23,0.2)",
        }}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {children}
      </div>
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
      className="p-5 border rounded-xl"
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
          className="w-10 h-10 flex items-center justify-center rounded-xl"
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
      className="p-6 border rounded-xl"
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
        className="px-5 py-3 text-sm font-bold rounded-xl"
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

  return (
    <span
      className="inline-flex px-3 py-1 text-xs font-bold rounded-lg"
      style={
        styles[status]
      }
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
      className="inline-flex px-3 py-1 text-xs font-bold rounded-lg"
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

/*
 * ============================================================
 * SUPPORT STATUS
 * ============================================================
 */

function SupportStatusBadge({
  status,
}: {
  status:
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED";
}) {
  if (status === "RESOLVED") {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-lg"
        style={{
          background:
            "rgba(93,204,138,0.08)",
          color:
            "#5dcc8a",
        }}
      >
        <CheckCircle
          size={12}
        />
        RESOLVED
      </span>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-lg"
        style={{
          background:
            "rgba(212,160,23,0.08)",
          color:
            "#d4a017",
        }}
      >
        <Clock
          size={12}
        />
        IN PROGRESS
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-lg"
      style={{
        background:
          "rgba(80,140,255,0.08)",
        color:
          "#8fb8ff",
      }}
    >
      <AlertTriangle
        size={12}
      />
      OPEN
    </span>
  );
}
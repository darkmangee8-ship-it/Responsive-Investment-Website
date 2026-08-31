import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

type Profile = {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
};

type IconProps = {
    size?: number;
};

function GridIcon({ size = 21 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    );
}

function PackageIcon({ size = 21 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 8l-9-5-9 5 9 5 9-5Z" />
            <path d="M3 8v8l9 5 9-5V8" />
            <path d="M12 13v8" />
        </svg>
    );
}

function TrendingUpIcon({ size = 21 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="3 17 9 11 13 15 21 7" />
            <polyline points="15 7 21 7 21 13" />
        </svg>
    );
}

function WalletIcon({ size = 21 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5v-9Z" />
            <path d="M3 8h16" />
            <path d="M16 13h5" />
            <circle cx="16" cy="13" r=".5" fill="currentColor" />
        </svg>
    );
}

function ArrowDownIcon({ size = 21 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v10" />
            <path d="m8 13 4 4 4-4" />
        </svg>
    );
}

function ArrowUpIcon({ size = 21 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 17V7" />
            <path d="m8 11 4-4 4 4" />
        </svg>
    );
}

function ReceiptIcon({ size = 21 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
            <path d="M9 8h6" />
            <path d="M9 12h6" />
            <path d="M9 16h3" />
        </svg>
    );
}

function BellIcon({ size = 21 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
        </svg>
    );
}

function UserIcon({ size = 21 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
    );
}

function SettingsIcon({ size = 21 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4.5v-2.6h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4.5h2.6v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v2.6h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
    );
}

function HeadphoneIcon({ size = 21 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
            <path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4Z" />
            <path d="M20 14h-3v5h2a1 1 0 0 0 1-1v-4Z" />
            <path d="M17 19c0 1.1-1.3 2-3 2h-2" />
        </svg>
    );
}

function MenuIcon({ size = 22 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        >
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
        </svg>
    );
}

function XIcon({ size = 22 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        >
            <path d="m6 6 12 12" />
            <path d="m18 6-12 12" />
        </svg>
    );
}

type NavItem = {
    label: string;
    to: string;
    icon: React.ReactNode;
};

export default function DashboardLayout() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    /*
     * =========================================================
     * LOAD USER PROFILE
     * =========================================================
     */

    useEffect(() => {
        let mounted = true;

        async function loadUser() {
            try {
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError || !user) {
                    navigate("/login", { replace: true });
                    return;
                }

                const { data, error } = await supabase
                    .from("profiles")
                    .select("first_name, last_name, email")
                    .eq("id", user.id)
                    .single();

                if (error) {
                    console.error("PROFILE ERROR:", error);
                }

                if (!mounted) return;

                setProfile(
                    data ?? {
                        first_name: user.user_metadata?.first_name ?? "",
                        last_name: user.user_metadata?.last_name ?? "",
                        email: user.email ?? "",
                    }
                );

                await loadUnreadNotifications(user.id);

                if (mounted) {
                    setLoading(false);
                }
            } catch (error) {
                console.error("LOAD USER ERROR:", error);

                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadUser();

        return () => {
            mounted = false;
        };
    }, [navigate]);

    /*
     * =========================================================
     * NOTIFICATION COUNT
     * =========================================================
     */

    async function loadUnreadNotifications(userId: string) {
        const { count, error } = await supabase
            .from("notifications")
            .select("id", {
                count: "exact",
                head: true,
            })
            .eq("user_id", userId)
            .eq("read", false);

        if (error) {
            console.error(
                "NOTIFICATION COUNT ERROR:",
                error
            );
            return;
        }

        setUnreadNotifications(count ?? 0);
    }

    /*
     * =========================================================
     * REALTIME NOTIFICATIONS
     * =========================================================
     */

    useEffect(() => {
        let channel:
            | ReturnType<typeof supabase.channel>
            | null = null;

        let mounted = true;

        async function setupNotifications() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user || !mounted) return;

            channel = supabase
                .channel(
                    `user-notifications-${user.id}`
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "notifications",
                        filter: `user_id=eq.${user.id}`,
                    },
                    () => {
                        loadUnreadNotifications(user.id);
                    }
                )
                .subscribe();
        }

        setupNotifications();

        return () => {
            mounted = false;

            if (channel) {
                supabase.removeChannel(
                    channel
                );
            }
        };
    }, []);

    /*
     * =========================================================
     * REALTIME PRESENCE
     * =========================================================
     */

    useEffect(() => {
        let presenceChannel:
            | ReturnType<typeof supabase.channel>
            | null = null;

        let cancelled = false;

        async function setupPresence() {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user || cancelled) return;

                presenceChannel =
                    supabase.channel("site-presence", {
                        config: {
                            presence: {
                                key: user.id,
                            },
                        },
                    });

                presenceChannel
                    .on(
                        "presence",
                        { event: "sync" },
                        () => {
                            console.log(
                                "Online users:",
                                presenceChannel?.presenceState()
                            );
                        }
                    )
                    .on(
                        "presence",
                        { event: "join" },
                        ({ key }) => {
                            console.log(
                                "User came online:",
                                key
                            );
                        }
                    )
                    .on(
                        "presence",
                        { event: "leave" },
                        ({ key }) => {
                            console.log(
                                "User went offline:",
                                key
                            );
                        }
                    )
                    .subscribe(
                        async (status) => {
                            if (
                                status ===
                                "SUBSCRIBED"
                            ) {
                                await presenceChannel?.track(
                                    {
                                        user_id:
                                            user.id,

                                        email:
                                            user.email ??
                                            "",

                                        online_at:
                                            new Date().toISOString(),
                                    }
                                );

                                console.log(
                                    "Presence tracking started."
                                );
                            }
                        }
                    );
            } catch (error) {
                console.error(
                    "PRESENCE ERROR:",
                    error
                );
            }
        }

        setupPresence();

        return () => {
            cancelled = true;

            if (presenceChannel) {
                presenceChannel
                    .untrack()
                    .catch(() => { });

                supabase.removeChannel(
                    presenceChannel
                );
            }
        };
    }, []);

    /*
     * =========================================================
     * LOGOUT
     * =========================================================
     */

    async function logout() {
        setMenuOpen(false);

        await supabase.auth.signOut();

        navigate("/login", {
            replace: true,
        });
    }

    /*
     * =========================================================
     * LOADING
     * =========================================================
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
                        className="w-12 h-12 mx-auto flex items-center justify-center font-black text-lg mb-4 rounded-xl"
                        style={{
                            background: "#d4a017",
                            color: "#09090e",
                        }}
                    >
                        ME
                    </div>

                    <p
                        className="text-sm"
                        style={{
                            color: "#9090a8",
                        }}
                    >
                        Loading your dashboard...
                    </p>

                </div>
            </div>
        );
    }

    const firstName =
        profile?.first_name || "User";

    const initials =
        `${profile?.first_name?.charAt(0) ?? ""}${profile?.last_name?.charAt(0) ?? ""}`
            .trim()
            .toUpperCase() ||
        firstName.charAt(0).toUpperCase();

    /*
     * =========================================================
     * DESKTOP NAVIGATION
     * =========================================================
     */

    const desktopLinks: NavItem[] = [
        {
            label: "Dashboard",
            to: "/dashboard",
            icon: <GridIcon />,
        },
        {
            label: "Plans",
            to: "/dashboard/plans",
            icon: <PackageIcon />,
        },
        {
            label: "Investments",
            to: "/dashboard/investments",
            icon: <TrendingUpIcon />,
        },
        {
            label: "Wallet",
            to: "/dashboard/wallet",
            icon: <WalletIcon />,
        },
        {
            label: "Deposit",
            to: "/dashboard/deposit",
            icon: <ArrowDownIcon />,
        },
        {
            label: "Withdraw",
            to: "/dashboard/withdraw",
            icon: <ArrowUpIcon />,
        },
        {
            label: "Transactions",
            to: "/dashboard/transactions",
            icon: <ReceiptIcon />,
        },
        {
            label: "Notifications",
            to: "/dashboard/notifications",
            icon: <BellIcon />,
        },
        {
            label: "Profile",
            to: "/dashboard/profile",
            icon: <UserIcon />,
        },
        {
            label: "Settings",
            to: "/dashboard/settings",
            icon: <SettingsIcon />,
        },
        {
            label: "Support",
            to: "/dashboard/support",
            icon: <HeadphoneIcon />,
        },
    ];

    /*
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (
        <div
            className="min-h-screen"
            style={{
                background: "#09090e",
                color: "#f5f0e8",
            }}
        >

            {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}

            <aside
                className="fixed left-0 top-0 bottom-0 hidden lg:flex w-[250px] flex-col border-r z-40"
                style={{
                    background: "#0d0d14",
                    borderColor:
                        "rgba(255,255,255,0.07)",
                }}
            >

                {/* BRAND */}

                <div
                    className="px-5 py-5 border-b"
                    style={{
                        borderColor:
                            "rgba(255,255,255,0.07)",
                    }}
                >
                    <NavLink
                        to="/dashboard"
                        className="flex items-center gap-3"
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-black"
                            style={{
                                background: "#d4a017",
                                color: "#09090e",
                            }}
                        >
                            ME
                        </div>

                        <div>
                            <div className="font-bold text-sm">
                                Musk Enterprise
                            </div>

                            <div
                                className="text-[10px] uppercase tracking-widest mt-0.5"
                                style={{
                                    color: "#6f6f80",
                                }}
                            >
                                Member Portal
                            </div>
                        </div>
                    </NavLink>
                </div>

                {/* NAVIGATION */}

                <nav className="flex-1 px-3 py-5 overflow-y-auto">

                    <p
                        className="px-3 mb-3 text-[10px] uppercase tracking-widest font-semibold"
                        style={{
                            color: "#555563",
                        }}
                    >
                        Main Menu
                    </p>

                    {desktopLinks.slice(0, 8).map(
                        (item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === "/dashboard"}
                                className="relative flex items-center gap-3 px-3 py-3 mb-1 rounded-xl text-sm transition-all"
                                style={({ isActive }) => ({
                                    background:
                                        isActive
                                            ? "rgba(212,160,23,0.12)"
                                            : "transparent",

                                    color:
                                        isActive
                                            ? "#d4a017"
                                            : "#8d8d9e",
                                })}
                            >
                                {item.icon}

                                <span>
                                    {item.label}
                                </span>

                                {item.label ===
                                    "Notifications" &&
                                    unreadNotifications >
                                    0 && (
                                        <span
                                            className="ml-auto min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                                            style={{
                                                background:
                                                    "#d4a017",
                                                color:
                                                    "#09090e",
                                            }}
                                        >
                                            {unreadNotifications >
                                                99
                                                ? "99+"
                                                : unreadNotifications}
                                        </span>
                                    )}
                            </NavLink>
                        )
                    )}

                    <p
                        className="px-3 mt-7 mb-3 text-[10px] uppercase tracking-widest font-semibold"
                        style={{
                            color: "#555563",
                        }}
                    >
                        Account
                    </p>

                    {desktopLinks.slice(8).map(
                        (item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className="flex items-center gap-3 px-3 py-3 mb-1 rounded-xl text-sm transition-all"
                                style={({
                                    isActive,
                                }) => ({
                                    background:
                                        isActive
                                            ? "rgba(212,160,23,0.12)"
                                            : "transparent",

                                    color:
                                        isActive
                                            ? "#d4a017"
                                            : "#8d8d9e",
                                })}
                            >
                                {item.icon}

                                <span>
                                    {item.label}
                                </span>
                            </NavLink>
                        )
                    )}

                </nav>

                {/* USER */}

                <div
                    className="p-4 border-t"
                    style={{
                        borderColor:
                            "rgba(255,255,255,0.07)",
                    }}
                >
                    <div className="flex items-center gap-3">

                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
                            style={{
                                background:
                                    "rgba(212,160,23,0.13)",
                                color: "#d4a017",
                            }}
                        >
                            {initials}
                        </div>

                        <div className="min-w-0 flex-1">

                            <p className="text-sm font-semibold truncate">
                                {firstName}
                            </p>

                            <p
                                className="text-xs truncate"
                                style={{
                                    color: "#666676",
                                }}
                            >
                                {profile?.email}
                            </p>

                        </div>

                    </div>

                    <button
                        onClick={logout}
                        className="w-full mt-3 px-3 py-2.5 rounded-lg text-left text-xs"
                        style={{
                            color: "#777789",
                            background:
                                "rgba(255,255,255,0.025)",
                        }}
                    >
                        Sign out
                    </button>

                </div>

            </aside>

            {/* =====================================================
          MAIN
      ====================================================== */}

            <main className="lg:ml-[250px] min-h-screen">

                {/* ===================================================
            MOBILE / DESKTOP TOP BAR
        ==================================================== */}

                <header
                    className="h-[68px] px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b sticky top-0 z-30"
                    style={{
                        background:
                            "rgba(9,9,14,0.94)",
                        borderColor:
                            "rgba(255,255,255,0.07)",
                        backdropFilter:
                            "blur(14px)",
                    }}
                >

                    {/* LEFT SIDE */}

                    <div className="flex items-center gap-3">

                        {/* MOBILE MENU BUTTON */}

                        <button
                            type="button"
                            onClick={() =>
                                setMenuOpen(true)
                            }
                            className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background:
                                    "rgba(255,255,255,0.05)",
                                color: "#d4a017",
                            }}
                            aria-label="Open dashboard menu"
                        >
                            <MenuIcon size={22} />
                        </button>

                        {/* MOBILE BRAND */}

                        <div className="lg:hidden flex items-center gap-2">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black"
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
                                <p className="text-sm font-bold">
                                    Musk Enterprise
                                </p>

                                <p
                                    className="text-[9px]"
                                    style={{
                                        color:
                                            "#686878",
                                    }}
                                >
                                    Member Portal
                                </p>
                            </div>
                        </div>

                        {/* DESKTOP TITLE */}

                        <div className="hidden lg:flex items-center gap-2">

                            <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                    background:
                                        "#5dcc8a",
                                    boxShadow:
                                        "0 0 8px rgba(93,204,138,0.6)",
                                }}
                            />

                            <span
                                className="text-sm"
                                style={{
                                    color:
                                        "#777789",
                                }}
                            >
                                Member Dashboard
                            </span>

                        </div>

                    </div>

                    {/* RIGHT SIDE */}

                    <div className="flex items-center gap-2">

                        {/* NOTIFICATION */}

                        <NavLink
                            to="/dashboard/notifications"
                            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                color: "#a0a0b0",
                                background:
                                    "rgba(255,255,255,0.035)",
                            }}
                            aria-label="Notifications"
                        >
                            <BellIcon size={20} />

                            {unreadNotifications >
                                0 && (
                                    <span
                                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
                                        style={{
                                            background:
                                                "#d4a017",
                                            color:
                                                "#09090e",
                                            border:
                                                "2px solid #09090e",
                                        }}
                                    >
                                        {unreadNotifications >
                                            99
                                            ? "99+"
                                            : unreadNotifications}
                                    </span>
                                )}
                        </NavLink>

                        {/* PROFILE */}

                        <NavLink
                            to="/dashboard/profile"
                            aria-label="Open profile"
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background:
                                    "#d4a017",
                                color:
                                    "#09090e",
                            }}
                        >
                            {initials}
                        </NavLink>

                    </div>

                </header>

                {/* PAGE CONTENT */}

                <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-9 max-w-[1500px] pb-10">
                    <Outlet />
                </div>

            </main>

            {/* =====================================================
          MOBILE SLIDE-OUT MENU
      ====================================================== */}

            {menuOpen && (
                <div
                    className="fixed inset-0 z-[100] lg:hidden"
                >

                    {/* DARK BACKDROP */}

                    <button
                        type="button"
                        onClick={() =>
                            setMenuOpen(false)
                        }
                        aria-label="Close menu"
                        className="absolute inset-0 w-full h-full"
                        style={{
                            background:
                                "rgba(0,0,0,0.65)",
                            backdropFilter:
                                "blur(4px)",
                        }}
                    />

                    {/* SLIDE-OUT PANEL */}

                    <aside
                        className="absolute left-0 top-0 bottom-0 w-[82%] max-w-[320px] flex flex-col border-r"
                        style={{
                            background:
                                "#0d0d14",
                            borderColor:
                                "rgba(212,160,23,0.15)",
                            boxShadow:
                                "20px 0 60px rgba(0,0,0,0.35)",
                            animation:
                                "slideInFromLeft 220ms ease-out",
                        }}
                    >

                        {/* MENU HEADER */}

                        <div
                            className="px-5 py-5 border-b"
                            style={{
                                borderColor:
                                    "rgba(255,255,255,0.07)",
                            }}
                        >

                            <div className="flex items-center justify-between">

                                <NavLink
                                    to="/dashboard"
                                    onClick={() =>
                                        setMenuOpen(false)
                                    }
                                    className="flex items-center gap-3"
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black"
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
                                        <p className="font-bold text-sm">
                                            Musk Enterprise
                                        </p>

                                        <p
                                            className="text-[10px] uppercase tracking-widest mt-0.5"
                                            style={{
                                                color:
                                                    "#6f6f80",
                                            }}
                                        >
                                            Member Portal
                                        </p>
                                    </div>
                                </NavLink>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMenuOpen(false)
                                    }
                                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{
                                        background:
                                            "rgba(255,255,255,0.05)",
                                        color:
                                            "#9999a8",
                                    }}
                                    aria-label="Close menu"
                                >
                                    <XIcon size={19} />
                                </button>

                            </div>

                        </div>

                        {/* MOBILE NAVIGATION */}

                        <nav className="flex-1 overflow-y-auto px-3 py-5">

                            <p
                                className="px-3 mb-3 text-[10px] uppercase tracking-widest font-semibold"
                                style={{
                                    color:
                                        "#555563",
                                }}
                            >
                                Navigation
                            </p>

                            {desktopLinks.map(
                                (item) => (
                                    <NavLink
                                        key={
                                            item.to
                                        }
                                        to={
                                            item.to
                                        }
                                        end={
                                            item.to ===
                                            "/dashboard"
                                        }
                                        onClick={() =>
                                            setMenuOpen(
                                                false
                                            )
                                        }
                                        className="flex items-center gap-3 px-3 py-3.5 mb-1 rounded-xl text-sm"
                                        style={({
                                            isActive,
                                        }) => ({
                                            background:
                                                isActive
                                                    ? "rgba(212,160,23,0.12)"
                                                    : "transparent",

                                            color:
                                                isActive
                                                    ? "#d4a017"
                                                    : "#8d8d9e",
                                        })}
                                    >

                                        {item.icon}

                                        <span className="flex-1">
                                            {
                                                item.label
                                            }
                                        </span>

                                        {item.label ===
                                            "Notifications" &&
                                            unreadNotifications >
                                            0 && (
                                                <span
                                                    className="min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                                                    style={{
                                                        background:
                                                            "#d4a017",
                                                        color:
                                                            "#09090e",
                                                    }}
                                                >
                                                    {unreadNotifications >
                                                        99
                                                        ? "99+"
                                                        : unreadNotifications}
                                                </span>
                                            )}

                                    </NavLink>
                                )
                            )}

                        </nav>

                        {/* USER / LOGOUT */}

                        <div
                            className="p-4 border-t"
                            style={{
                                borderColor:
                                    "rgba(255,255,255,0.07)",
                            }}
                        >

                            <div className="flex items-center gap-3">

                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black"
                                    style={{
                                        background:
                                            "rgba(212,160,23,0.13)",
                                        color:
                                            "#d4a017",
                                    }}
                                >
                                    {initials}
                                </div>

                                <div className="min-w-0 flex-1">

                                    <p className="text-sm font-bold truncate">
                                        {firstName}
                                    </p>

                                    <p
                                        className="text-xs truncate mt-0.5"
                                        style={{
                                            color:
                                                "#666676",
                                        }}
                                    >
                                        {profile?.email}
                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={logout}
                                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
                                style={{
                                    background:
                                        "rgba(255,70,70,0.07)",
                                    border:
                                        "1px solid rgba(255,70,70,0.12)",
                                    color:
                                        "#ff8b8b",
                                }}
                            >
                                Sign out
                            </button>

                        </div>

                    </aside>

                    {/* SLIDE ANIMATION */}

                    <style>
                        {`
              @keyframes slideInFromLeft {
                from {
                  transform: translateX(-100%);
                }
                to {
                  transform: translateX(0);
                }
              }
            `}
                    </style>

                </div>
            )}

        </div>
    );
}
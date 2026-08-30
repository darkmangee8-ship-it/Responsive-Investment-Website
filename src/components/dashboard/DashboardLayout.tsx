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

    useEffect(() => {
        let mounted = true;

        async function loadUser() {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
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

                setLoading(false);
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
     * Load unread notification count.
     */
    async function loadUnreadNotifications(userId: string) {
        const { count, error } = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("read", false);

        if (error) {
            console.error("NOTIFICATION COUNT ERROR:", error);
            return;
        }

        setUnreadNotifications(count ?? 0);
    }

    /*
     * Realtime notification updates.
     *
     * When a notification is created or marked read,
     * the badge updates automatically.
     */
    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null;
        let mounted = true;

        async function setupNotifications() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user || !mounted) return;

            channel = supabase
                .channel(`user-notifications-${user.id}`)
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
                supabase.removeChannel(channel);
            }
        };
    }, []);

    /*
     * REALTIME PRESENCE
     *
     * This keeps the logged-in user visible as online
     * for the admin panel.
     */
    useEffect(() => {
        let presenceChannel: ReturnType<typeof supabase.channel> | null = null;
        let cancelled = false;

        async function setupPresence() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user || cancelled) return;

            presenceChannel = supabase.channel("site-presence", {
                config: {
                    presence: {
                        key: user.id,
                    },
                },
            });

            presenceChannel
                .on("presence", { event: "sync" }, () => {
                    console.log(
                        "Online users:",
                        presenceChannel?.presenceState()
                    );
                })
                .on("presence", { event: "join" }, ({ key }) => {
                    console.log("User came online:", key);
                })
                .on("presence", { event: "leave" }, ({ key }) => {
                    console.log("User went offline:", key);
                })
                .subscribe(async (status) => {
                    if (status === "SUBSCRIBED") {
                        await presenceChannel?.track({
                            user_id: user.id,
                            email: user.email ?? "",
                            online_at: new Date().toISOString(),
                        });
                    }
                });
        }

        setupPresence();

        return () => {
            cancelled = true;

            if (presenceChannel) {
                presenceChannel.untrack().catch(() => { });
                supabase.removeChannel(presenceChannel);
            }
        };
    }, []);

    async function logout() {
        setMenuOpen(false);

        await supabase.auth.signOut();

        navigate("/login", { replace: true });
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090e] text-[#f5f0e8] flex items-center justify-center">
                <div className="text-center">
                    <div
                        className="w-12 h-12 mx-auto flex items-center justify-center font-black text-lg mb-4"
                        style={{
                            background: "#d4a017",
                            color: "#09090e",
                        }}
                    >
                        ME
                    </div>

                    <p className="text-sm" style={{ color: "#9090a8" }}>
                        Loading your dashboard...
                    </p>
                </div>
            </div>
        );
    }

    const firstName = profile?.first_name || "User";

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
            label: "Support",
            to: "/dashboard/support",
            icon: <HeadphoneIcon />,
        },
    ];

    const mobileLinks: NavItem[] = [
        {
            label: "Home",
            to: "/dashboard",
            icon: <GridIcon size={20} />,
        },
        {
            label: "Plans",
            to: "/dashboard/plans",
            icon: <PackageIcon size={20} />,
        },
        {
            label: "Invest",
            to: "/dashboard/investments",
            icon: <TrendingUpIcon size={20} />,
        },
        {
            label: "Wallet",
            to: "/dashboard/wallet",
            icon: <WalletIcon size={20} />,
        },
    ];

    return (
        <div className="min-h-screen bg-[#09090e] text-[#f5f0e8]">
            {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}

            <aside
                className="fixed left-0 top-0 bottom-0 hidden lg:flex w-[250px] flex-col border-r z-40"
                style={{
                    background: "#0d0d14",
                    borderColor: "rgba(255,255,255,0.07)",
                }}
            >
                {/* BRAND */}
                <div
                    className="px-5 py-5 border-b"
                    style={{
                        borderColor: "rgba(255,255,255,0.07)",
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

                {/* NAV */}
                <nav className="flex-1 px-3 py-5 overflow-y-auto">
                    <p
                        className="px-3 mb-3 text-[10px] uppercase tracking-widest font-semibold"
                        style={{
                            color: "#555563",
                        }}
                    >
                        Main Menu
                    </p>

                    {desktopLinks.slice(0, 8).map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/dashboard"}
                            className="relative flex items-center gap-3 px-3 py-3 mb-1 rounded-xl text-sm transition-all"
                            style={({ isActive }) => ({
                                background: isActive
                                    ? "rgba(212,160,23,0.12)"
                                    : "transparent",
                                color: isActive ? "#d4a017" : "#8d8d9e",
                            })}
                        >
                            {item.icon}

                            <span>{item.label}</span>

                            {item.label === "Notifications" &&
                                unreadNotifications > 0 && (
                                    <span
                                        className="ml-auto min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                                        style={{
                                            background: "#d4a017",
                                            color: "#09090e",
                                        }}
                                    >
                                        {unreadNotifications > 99
                                            ? "99+"
                                            : unreadNotifications}
                                    </span>
                                )}
                        </NavLink>
                    ))}

                    <p
                        className="px-3 mt-7 mb-3 text-[10px] uppercase tracking-widest font-semibold"
                        style={{
                            color: "#555563",
                        }}
                    >
                        Account
                    </p>

                    {desktopLinks.slice(8).map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className="flex items-center gap-3 px-3 py-3 mb-1 rounded-xl text-sm transition-all"
                            style={({ isActive }) => ({
                                background: isActive
                                    ? "rgba(212,160,23,0.12)"
                                    : "transparent",
                                color: isActive ? "#d4a017" : "#8d8d9e",
                            })}
                        >
                            {item.icon}

                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* USER */}
                <div
                    className="p-4 border-t"
                    style={{
                        borderColor: "rgba(255,255,255,0.07)",
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
                            style={{
                                background: "rgba(212,160,23,0.13)",
                                color: "#d4a017",
                            }}
                        >
                            {firstName.charAt(0).toUpperCase()}
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
                            background: "rgba(255,255,255,0.025)",
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
                {/* TOP HEADER */}
                <header
                    className="h-[68px] px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b sticky top-0 z-30"
                    style={{
                        background: "rgba(9,9,14,0.94)",
                        borderColor: "rgba(255,255,255,0.07)",
                        backdropFilter: "blur(14px)",
                    }}
                >
                    {/* MOBILE BRAND */}
                    <div className="lg:hidden flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black"
                            style={{
                                background: "#d4a017",
                                color: "#09090e",
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
                                    color: "#686878",
                                }}
                            >
                                Member Portal
                            </p>
                        </div>
                    </div>

                    {/* DESKTOP TITLE */}
                    <div
                        className="hidden lg:block text-sm"
                        style={{
                            color: "#777789",
                        }}
                    >
                        Member Dashboard
                    </div>

                    <div className="flex items-center gap-2">
                        {/* NOTIFICATIONS */}
                        <NavLink
                            to="/dashboard/notifications"
                            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                color: "#a0a0b0",
                                background: "rgba(255,255,255,0.035)",
                            }}
                            aria-label="Notifications"
                        >
                            <BellIcon size={20} />

                            {unreadNotifications > 0 && (
                                <span
                                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
                                    style={{
                                        background: "#d4a017",
                                        color: "#09090e",
                                        border: "2px solid #09090e",
                                    }}
                                >
                                    {unreadNotifications > 99
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
                                background: "#d4a017",
                                color: "#09090e",
                            }}
                        >
                            {firstName.charAt(0).toUpperCase()}
                        </NavLink>

                        {/* MOBILE MENU */}
                        <button
                            type="button"
                            onClick={() => setMenuOpen(true)}
                            className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                color: "#a0a0b0",
                                background: "rgba(255,255,255,0.035)",
                            }}
                            aria-label="Open menu"
                        >
                            <MenuIcon />
                        </button>
                    </div>
                </header>

                {/* CONTENT */}
                <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-9 max-w-[1500px] pb-24 lg:pb-10">
                    <Outlet />
                </div>
            </main>

            {/* =====================================================
          MOBILE BOTTOM NAV
      ====================================================== */}

            <nav
                className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
                style={{
                    background: "rgba(13,13,20,0.97)",
                    borderColor: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(16px)",
                }}
            >
                <div className="grid grid-cols-5 px-2 py-2">
                    {mobileLinks.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/dashboard"}
                            className="relative flex flex-col items-center justify-center gap-1 py-2 rounded-xl"
                            style={({ isActive }) => ({
                                color: isActive ? "#d4a017" : "#6f6f80",
                            })}
                        >
                            {item.icon}

                            <span className="text-[10px] font-medium">
                                {item.label}
                            </span>
                        </NavLink>
                    ))}

                    {/* MENU */}
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl"
                        style={{
                            color: "#6f6f80",
                        }}
                    >
                        <MenuIcon size={20} />

                        <span className="text-[10px] font-medium">
                            Menu
                        </span>
                    </button>
                </div>
            </nav>

            {/* =====================================================
          MOBILE MENU OVERLAY
      ====================================================== */}

            {menuOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden">
                    {/* BACKDROP */}
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setMenuOpen(false)}
                        className="absolute inset-0 w-full h-full"
                        style={{
                            background: "rgba(0,0,0,0.65)",
                            backdropFilter: "blur(5px)",
                        }}
                    />

                    {/* MENU PANEL */}
                    <div
                        className="absolute left-0 right-0 bottom-0 rounded-t-[24px] p-5 pb-8 border-t"
                        style={{
                            background: "#111118",
                            borderColor: "rgba(212,160,23,0.15)",
                        }}
                    >
                        {/* HANDLE */}
                        <div
                            className="w-10 h-1 rounded-full mx-auto mb-5"
                            style={{
                                background: "rgba(255,255,255,0.15)",
                            }}
                        />

                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-bold">
                                    Menu
                                </h2>

                                <p
                                    className="text-xs mt-1"
                                    style={{
                                        color: "#6f6f80",
                                    }}
                                >
                                    Account & more
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setMenuOpen(false)}
                                className="w-9 h-9 rounded-full flex items-center justify-center"
                                style={{
                                    background: "rgba(255,255,255,0.05)",
                                    color: "#9999a8",
                                }}
                            >
                                <XIcon size={19} />
                            </button>
                        </div>

                        {/* MENU ITEMS */}
                        <div className="grid grid-cols-2 gap-2">
                            {desktopLinks.slice(1, 8).map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 p-4 rounded-xl"
                                    style={{
                                        background: "rgba(255,255,255,0.035)",
                                        color: "#a0a0b0",
                                    }}
                                >
                                    {item.icon}

                                    <span className="text-sm font-medium">
                                        {item.label}
                                    </span>

                                    {item.label === "Notifications" &&
                                        unreadNotifications > 0 && (
                                            <span
                                                className="ml-auto min-w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                                                style={{
                                                    background: "#d4a017",
                                                    color: "#09090e",
                                                }}
                                            >
                                                {unreadNotifications}
                                            </span>
                                        )}
                                </NavLink>
                            ))}

                            <NavLink
                                to="/dashboard/profile"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 p-4 rounded-xl"
                                style={{
                                    background: "rgba(255,255,255,0.035)",
                                    color: "#a0a0b0",
                                }}
                            >
                                <UserIcon />

                                <span className="text-sm font-medium">
                                    Profile
                                </span>
                            </NavLink>

                            <NavLink
                                to="/dashboard/settings"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 p-4 rounded-xl"
                                style={{
                                    background: "rgba(255,255,255,0.035)",
                                    color: "#a0a0b0",
                                }}
                            >
                                <SettingsIcon />

                                <span className="text-sm font-medium">
                                    Settings
                                </span>
                            </NavLink>

                            <NavLink
                                to="/dashboard/support"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 p-4 rounded-xl"
                                style={{
                                    background: "rgba(255,255,255,0.035)",
                                    color: "#a0a0b0",
                                }}
                            >
                                <HeadphoneIcon />

                                <span className="text-sm font-medium">
                                    Support
                                </span>
                            </NavLink>
                        </div>

                        {/* SIGN OUT */}
                        <button
                            type="button"
                            onClick={logout}
                            className="w-full mt-4 py-3.5 rounded-xl text-sm font-semibold"
                            style={{
                                background: "rgba(255,70,70,0.07)",
                                color: "#ff8b8b",
                                border: "1px solid rgba(255,70,70,0.12)",
                            }}
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
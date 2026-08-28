import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { Package, TrendingUp } from "lucide-react";
import { supabase } from "../../lib/supabase";

type Profile = {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
};

const mobileLinks = [
    { label: "Home", to: "/dashboard", icon: "bx-home-alt-2" },
    { label: "Wallet", to: "/dashboard/wallet", icon: "bx-wallet" },
    { label: "Plans", to: "/dashboard/plans", icon: "package" },
    { label: "Invest", to: "/dashboard/investments", icon: "trending-up" },
    { label: "Profile", to: "/dashboard/profile", icon: "bx-user" },
];

export default function DashboardLayout() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    async function loadUser() {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            navigate("/login", { replace: true });
            return;
        }

        const { data } = await supabase
            .from("profiles")
            .select("first_name, last_name, email")
            .eq("id", user.id)
            .single();

        setProfile(
            data ?? {
                first_name: user.user_metadata?.first_name ?? "",
                last_name: user.user_metadata?.last_name ?? "",
                email: user.email ?? "",
            }
        );
        setLoading(false);
    }

    async function logout() {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090e] text-white">
                Loading your dashboard...
            </div>
        );
    }

    const firstName = profile?.first_name || "User";
    const links = [
        ["Overview", "/dashboard", "⌂"],
        ["Wallet", "/dashboard/wallet", "◈"],
        ["Investment Plans", "/dashboard/plans", "▣"],
        ["My Investments", "/dashboard/investments", "↗"],
        ["Deposit", "/dashboard/deposit", "+"],
        ["Withdraw", "/dashboard/withdraw", "↓"],
        ["Transactions", "/dashboard/transactions", "≡"],
        ["Notifications", "/dashboard/notifications", "♢"],
        ["Profile", "/dashboard/profile", "◎"],
        ["Settings", "/dashboard/settings", "⚙"],
        ["Support", "/dashboard/support", "?"],
    ];

    return (
        <div className="min-h-screen bg-[#09090e] text-[#f5f0e8]">
            <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col border-r lg:flex" style={{ background: "#0d0d14", borderColor: "rgba(212,160,23,0.15)" }}>
                <div className="border-b px-6 py-6" style={{ borderColor: "rgba(212,160,23,0.15)" }}>
                    <NavLink to="/dashboard" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center font-black" style={{ background: "#d4a017", color: "#09090e" }}>ME</div>
                        <div><div className="font-bold">Musk Enterprise</div><div className="text-[10px] uppercase tracking-widest" style={{ color: "#777789" }}>Member Portal</div></div>
                    </NavLink>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Dashboard navigation">
                    {links.map(([label, to, icon]) => (
                        <NavLink key={to} to={to} end={to === "/dashboard"} className="mb-1 flex items-center gap-3 px-4 py-3 text-sm" style={({ isActive }) => ({ background: isActive ? "rgba(212,160,23,0.12)" : "transparent", color: isActive ? "#d4a017" : "#9090a8" })}>
                            <span className="w-5 text-center" aria-hidden="true">{icon}</span>{label}
                        </NavLink>
                    ))}
                </nav>
                <div className="border-t p-4" style={{ borderColor: "rgba(212,160,23,0.15)" }}>
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full font-bold" style={{ background: "rgba(212,160,23,0.15)", color: "#d4a017" }}>{firstName.charAt(0).toUpperCase()}</div>
                        <div className="min-w-0"><p className="truncate text-sm font-semibold">{firstName}</p><p className="truncate text-xs" style={{ color: "#777789" }}>{profile?.email}</p></div>
                    </div>
                    <button onClick={logout} className="w-full px-4 py-3 text-left text-sm" style={{ color: "#9090a8" }}>Sign out</button>
                </div>
            </aside>

            <main className="min-h-screen lg:ml-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b px-5 lg:px-8" style={{ background: "rgba(9,9,14,0.95)", borderColor: "rgba(212,160,23,0.12)", backdropFilter: "blur(12px)" }}>
                    <div className="font-bold lg:hidden">Musk Enterprise</div>
                    <div className="hidden text-sm lg:block" style={{ color: "#777789" }}>Member Dashboard</div>
                    <NavLink to="/dashboard/profile" aria-label="Open profile"><div className="flex h-9 w-9 items-center justify-center rounded-full font-bold" style={{ background: "#d4a017", color: "#09090e" }}>{firstName.charAt(0).toUpperCase()}</div></NavLink>
                </header>
                <div className="max-w-[1600px] px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:py-10 lg:pb-10"><Outlet /></div>
            </main>

            <nav className="fixed bottom-0 left-0 right-0 z-40 border-t lg:hidden" aria-label="Quick dashboard navigation" style={{ background: "#0d0d14", borderColor: "rgba(212,160,23,0.15)" }}>
                <div className="grid grid-cols-5">
                    {mobileLinks.map((link) => (
                        <NavLink key={link.to} to={link.to} end={link.to === "/dashboard"} className="flex flex-col items-center gap-1 py-2.5 text-[10px]" style={({ isActive }) => ({ color: isActive ? "#d4a017" : "#777789" })}>
                            {link.icon === "package" ? (
                                <Package size={20} strokeWidth={1.75} aria-hidden="true" />
                            ) : link.icon === "trending-up" ? (
                                <TrendingUp size={20} strokeWidth={1.75} aria-hidden="true" />
                            ) : (
                                <i className={`bxr ${link.icon} text-xl`} aria-hidden="true" />
                            )}
                            {link.label}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
}

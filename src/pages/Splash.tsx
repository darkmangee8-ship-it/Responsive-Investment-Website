import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Splash() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = window.setTimeout(() => {
            navigate("/onboarding", { replace: true });
        }, 2200);

        return () => window.clearTimeout(timer);
    }, [navigate]);

    return (
        <div
            className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{
                background:
                    "radial-gradient(circle at center, rgba(212,160,23,0.12), transparent 40%), #09090e",
                color: "#f5f0e8",
            }}
        >
            {/* Background decoration */}

            <div
                className="absolute w-96 h-96 rounded-full blur-3xl"
                style={{
                    background: "rgba(212,160,23,0.08)",
                }}
            />

            <div className="relative z-10 text-center px-6">

                {/* Logo */}

                <div
                    className="mx-auto w-20 h-20 flex items-center justify-center font-black text-2xl"
                    style={{
                        background: "#d4a017",
                        color: "#09090e",
                        boxShadow: "0 0 50px rgba(212,160,23,0.25)",
                    }}
                >
                    ME
                </div>

                <h1 className="mt-7 text-3xl sm:text-4xl font-black tracking-tight">
                    Musk Enterprise
                </h1>

                <p
                    className="mt-3 text-sm sm:text-base"
                    style={{ color: "#9090a8" }}
                >
                    Smart investing. Simple wealth management.
                </p>

                {/* Loading indicator */}

                <div className="mt-10 flex justify-center">
                    <div
                        className="w-8 h-8 rounded-full border-2 animate-spin"
                        style={{
                            borderColor: "rgba(212,160,23,0.2)",
                            borderTopColor: "#d4a017",
                        }}
                    />
                </div>

                <p
                    className="mt-4 text-[11px] uppercase tracking-[0.25em]"
                    style={{ color: "#777789" }}
                >
                    Welcome
                </p>

            </div>
        </div>
    );
}
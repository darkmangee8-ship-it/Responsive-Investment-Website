import { useState } from "react";
import { useNavigate } from "react-router";

const slides = [
    {
        icon: "bx-trending-up",
        eyebrow: "INVEST",
        title: "Put your money to work",
        description:
            "Choose an investment plan that fits your goals and track your investment directly from your dashboard.",
    },
    {
        icon: "bx-wallet",
        eyebrow: "MANAGE",
        title: "Everything in one wallet",
        description:
            "View your available balance, invested balance and accumulated profit from one simple wallet.",
    },
    {
        icon: "bx-shield-quarter",
        eyebrow: "CONTROL",
        title: "Stay in control",
        description:
            "Deposit funds, monitor your investments, request withdrawals and receive important account notifications.",
    },
];

export default function Onboarding() {
    const navigate = useNavigate();

    const [current, setCurrent] = useState(0);

    const slide = slides[current];
    const isLast = current === slides.length - 1;

    function next() {
        if (isLast) {
            navigate("/register", { replace: true });
            return;
        }

        setCurrent((value) => value + 1);
    }

    function skip() {
        navigate("/register", { replace: true });
    }

    return (
        <div
            className="min-h-screen flex flex-col relative overflow-hidden"
            style={{
                background: "#09090e",
                color: "#f5f0e8",
            }}
        >
            {/* Decorative glow */}

            <div
                className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
                style={{
                    background: "rgba(212,160,23,0.08)",
                }}
            />

            <div
                className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl"
                style={{
                    background: "rgba(212,160,23,0.05)",
                }}
            />

            {/* Header */}

            <header className="relative z-10 flex items-center justify-between px-5 py-6 sm:px-8">

                <div className="flex items-center gap-3">

                    <div
                        className="w-9 h-9 flex items-center justify-center text-sm font-black"
                        style={{
                            background: "#d4a017",
                            color: "#09090e",
                        }}
                    >
                        ME
                    </div>

                    <span className="font-bold">
                        Musk Enterprise
                    </span>

                </div>

                <button
                    onClick={skip}
                    className="text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{
                        color: "#9090a8",
                    }}
                >
                    Skip
                </button>

            </header>

            {/* Main */}

            <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">

                <div className="w-full max-w-xl text-center">

                    {/* Icon */}

                    <div
                        className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center"
                        style={{
                            background: "rgba(212,160,23,0.10)",
                            border: "1px solid rgba(212,160,23,0.20)",
                            boxShadow: "0 20px 70px rgba(212,160,23,0.08)",
                        }}
                    >
                        <i
                            className={`bx ${slide.icon} text-5xl sm:text-6xl`}
                            style={{
                                color: "#d4a017",
                            }}
                        />
                    </div>

                    {/* Text */}

                    <p
                        className="mt-10 text-xs font-bold tracking-[0.25em]"
                        style={{
                            color: "#d4a017",
                        }}
                    >
                        {slide.eyebrow}
                    </p>

                    <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                        {slide.title}
                    </h1>

                    <p
                        className="mt-5 text-sm sm:text-base leading-7 max-w-lg mx-auto"
                        style={{
                            color: "#9090a8",
                        }}
                    >
                        {slide.description}
                    </p>

                    {/* Dots */}

                    <div className="mt-10 flex items-center justify-center gap-2">

                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrent(index)}
                                aria-label={`Go to onboarding slide ${index + 1}`}
                                className="h-2 rounded-full transition-all"
                                style={{
                                    width: current === index ? 28 : 8,
                                    background:
                                        current === index
                                            ? "#d4a017"
                                            : "rgba(255,255,255,0.18)",
                                }}
                            />
                        ))}

                    </div>

                </div>

            </main>

            {/* Bottom controls */}

            <footer className="relative z-10 px-6 pb-8 sm:px-8">

                <div className="max-w-xl mx-auto">

                    <button
                        onClick={next}
                        className="w-full py-4 font-bold flex items-center justify-center gap-3 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                        style={{
                            background: "#d4a017",
                            color: "#09090e",
                        }}
                    >
                        {isLast ? "Open Account" : "Continue"}

                        <i className="bx bx-right-arrow-alt text-xl" />
                    </button>

                    <p
                        className="text-center text-xs mt-4"
                        style={{
                            color: "#777789",
                        }}
                    >
                        {current + 1} of {slides.length}
                    </p>

                </div>

            </footer>

        </div>
    );
}
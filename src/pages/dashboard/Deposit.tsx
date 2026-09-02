import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

type PaymentMethod =
  | "bitcoin"
  | "usdt"
  | "usdc"
  | "ethereum";

const cryptoDetails = {
  bitcoin: {
    name: "Bitcoin",
    symbol: "BTC",
    icon: "₿",
    address: "bc1q9wkkmuna70ulurfmr634z6wvq3atv4s52pgpe7",
    network: "Bitcoin",
  },
  usdt: {
    name: "Tether",
    symbol: "USDT",
    icon: "₮",
    address: "bc1q9wkkmuna70ulurfmr634z6wvq3atv4s52pgpe7",
    network: "TRC20",
  },
  usdc: {
    name: "USD Coin",
    symbol: "USDC",
    icon: "$",
    address: "bc1q9wkkmuna70ulurfmr634z6wvq3atv4s52pgpe7",
    network: "Ethereum",
  },
  ethereum: {
    name: "Ethereum",
    symbol: "ETH",
    icon: "Ξ",
    address: "bc1q9wkkmuna70ulurfmr634z6wvq3atv4s52pgpe7",
    network: "Ethereum",
  },
};

export default function Deposit() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [method, setMethod] =
    useState<PaymentMethod>("bitcoin");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login", { replace: true });
    }
  }

  async function copyToClipboard(
    text: string,
    identifier: string
  ) {
    if (!text) return;

    try {
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea =
          document.createElement("textarea");

        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const successful =
          document.execCommand("copy");

        document.body.removeChild(textarea);

        if (!successful) {
          throw new Error("Copy failed");
        }
      }

      setCopied(identifier);

      setTimeout(() => {
        setCopied("");
      }, 2000);
    } catch (err) {
      console.error("COPY ERROR:", err);
      setError(
        "Unable to copy. Please copy the address manually."
      );
    }
  }

  function formattedAmount() {
    const value = Number(amount);

    if (!value || value <= 0) {
      return "$0.00";
    }

    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function selectedCrypto() {
    return cryptoDetails[method];
  }

  async function submitDeposit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");
    setMessage(false);

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError(
        "Please enter a valid deposit amount."
      );
      return;
    }

    if (numericAmount < 10) {
      setError(
        "Minimum deposit amount is $10."
      );
      return;
    }

    if (!reference.trim()) {
      setError(
        `Please enter your ${selectedCrypto().name} transaction ID / hash.`
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const { error: depositError } =
        await supabase
          .from("deposits")
          .insert({
            user_id: user.id,
            amount: numericAmount,
            currency: "USD",
            provider: method,
            provider_reference:
              reference.trim(),
            status: "PENDING",
          });

      if (depositError) {
        console.error(
          "DEPOSIT INSERT ERROR:",
          depositError
        );

        setError(
          `Unable to submit deposit: ${depositError.message ||
          "Unknown database error"
          }`
        );

        return;
      }

      setAmount("");
      setReference("");
      setMessage(true);
    } catch (err) {
      console.error(
        "DEPOSIT ERROR:",
        err
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const crypto = selectedCrypto();

  return (
    <div className="pb-24">

      {/* PAGE HEADER */}

      <div className="mb-7">

        <p
          className="text-xs uppercase tracking-widest font-semibold mb-3"
          style={{ color: "#d4a017" }}
        >
          Wallet
        </p>

        <h1 className="text-3xl sm:text-4xl font-black">
          Deposit Funds
        </h1>

        <p
          className="mt-2 text-sm leading-6"
          style={{ color: "#9090a8" }}
        >
          Fund your wallet securely using
          cryptocurrency.
        </p>

      </div>

      <div className="max-w-3xl space-y-5">

        {/* PAYMENT METHOD */}

        <section>

          <h2 className="text-lg font-bold mb-3">
            Choose Cryptocurrency
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            {(
              Object.keys(
                cryptoDetails
              ) as PaymentMethod[]
            ).map((cryptoKey) => {

              const item =
                cryptoDetails[cryptoKey];

              const active =
                method === cryptoKey;

              return (
                <button
                  key={cryptoKey}
                  type="button"
                  onClick={() => {
                    setMethod(
                      cryptoKey
                    );
                    setReference("");
                    setError("");
                    setMessage(false);
                  }}
                  className="text-left p-4 border transition-all"
                  style={{
                    background: active
                      ? "rgba(212,160,23,0.08)"
                      : "#111118",
                    borderColor: active
                      ? "#d4a017"
                      : "rgba(212,160,23,0.15)",
                  }}
                >

                  <div
                    className="w-10 h-10 flex items-center justify-center text-lg font-black"
                    style={{
                      background:
                        "rgba(212,160,23,0.12)",
                      color: "#d4a017",
                    }}
                  >
                    {item.icon}
                  </div>

                  <p className="mt-3 font-bold">
                    {item.name}
                  </p>

                  <p
                    className="text-xs mt-1"
                    style={{
                      color: "#777789",
                    }}
                  >
                    {item.symbol}
                  </p>

                </button>
              );
            })}

          </div>

        </section>


        {/* AMOUNT */}

        <div
          className="p-5 sm:p-6 border"
          style={{
            background: "#111118",
            borderColor:
              "rgba(212,160,23,0.2)",
          }}
        >

          <label
            className="block text-sm font-semibold mb-2"
            style={{
              color: "#9090a8",
            }}
          >
            Deposit Amount
          </label>

          <div className="relative">

            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold"
              style={{
                color: "#d4a017",
              }}
            >
              $
            </span>

            <input
              type="number"
              min="10"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
              placeholder="1000.00"
              className="w-full px-4 pl-9 py-4 bg-transparent border outline-none text-xl font-bold"
              style={{
                color: "#f5f0e8",
                borderColor:
                  "rgba(212,160,23,0.25)",
              }}
            />

          </div>

          <p
            className="mt-2 text-xs"
            style={{
              color: "#777789",
            }}
          >
            Enter the USD value you intend
            to deposit.
          </p>

        </div>


        {/* EXACT AMOUNT */}

        <div
          className="p-5 border"
          style={{
            background:
              "rgba(255,170,0,0.08)",
            borderColor:
              "rgba(212,160,23,0.5)",
          }}
        >

          <div className="flex gap-3">

            <div className="text-xl">
              ⚠️
            </div>

            <div>

              <p
                className="font-black text-sm uppercase tracking-wide"
                style={{
                  color: "#e8b830",
                }}
              >
                Deposit Amount
              </p>

              <p
                className="mt-2 text-sm leading-6"
                style={{
                  color: "#d8d2c7",
                }}
              >
                Your selected deposit value is{" "}
                <strong
                  style={{
                    color: "#f5f0e8",
                  }}
                >
                  {formattedAmount()}
                </strong>
                .
              </p>

              <p
                className="mt-2 text-xs leading-5"
                style={{
                  color: "#9090a8",
                }}
              >
                Make sure your submitted
                transaction corresponds to
                the deposit amount entered.
              </p>

            </div>

          </div>

        </div>


        {/* CRYPTO DETAILS */}

        <div
          className="p-5 sm:p-6 border"
          style={{
            background: "#111118",
            borderColor:
              "rgba(212,160,23,0.2)",
          }}
        >

          <div className="flex items-center gap-3 mb-5">

            <div
              className="w-11 h-11 flex items-center justify-center text-xl font-black"
              style={{
                background:
                  "rgba(212,160,23,0.12)",
                color: "#d4a017",
              }}
            >
              {crypto.icon}
            </div>

            <div>

              <h2 className="text-xl font-bold">
                {crypto.name} Payment
              </h2>

              <p
                className="text-xs mt-1"
                style={{
                  color: "#9090a8",
                }}
              >
                Send only {crypto.symbol}
                {" "}using the{" "}
                {crypto.network}
                {" "}network.
              </p>

            </div>

          </div>

          {crypto.address ? (

            <div>

              <p
                className="text-xs mb-2 uppercase tracking-wider"
                style={{
                  color: "#777789",
                }}
              >
                {crypto.symbol} Wallet
                Address
              </p>

              <div className="flex flex-col sm:flex-row gap-2">

                <div
                  className="flex-1 min-w-0 px-4 py-4 border font-mono text-xs sm:text-sm break-all"
                  style={{
                    background: "#09090e",
                    borderColor:
                      "rgba(212,160,23,0.15)",
                  }}
                >
                  {crypto.address}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      crypto.address,
                      method
                    )
                  }
                  className="px-5 py-3 font-bold shrink-0"
                  style={{
                    background:
                      copied === method
                        ? "#5dcc8a"
                        : "#d4a017",
                    color: "#09090e",
                  }}
                >
                  {copied === method
                    ? "✓ Copied"
                    : "Copy Address"}
                </button>

              </div>

            </div>

          ) : (

            <div
              className="p-4 border text-sm"
              style={{
                background:
                  "rgba(255,170,0,0.05)",
                borderColor:
                  "rgba(212,160,23,0.2)",
                color: "#d8d2c7",
              }}
            >
              The {crypto.name} payment
              address has not been configured
              yet. We will add the verified
              wallet address before enabling
              this payment method.
            </div>

          )}

          <div
            className="mt-5 p-4 border text-xs leading-5"
            style={{
              background:
                "rgba(255,70,70,0.05)",
              borderColor:
                "rgba(255,70,70,0.15)",
              color: "#ffb0b0",
            }}
          >
            ⚠️ Send only{" "}
            {crypto.symbol} using the{" "}
            {crypto.network} network.
            Sending another cryptocurrency
            or using an unsupported network
            may result in permanent loss.
          </div>

        </div>


        {/* CONFIRM PAYMENT */}

        <form
          onSubmit={submitDeposit}
          className="p-5 sm:p-6 border"
          style={{
            background: "#111118",
            borderColor:
              "rgba(212,160,23,0.2)",
          }}
        >

          <h2 className="text-xl font-bold">
            Submit Payment
          </h2>

          <p
            className="text-sm mt-1 mb-5"
            style={{
              color: "#9090a8",
            }}
          >
            After completing your crypto
            transfer, enter the transaction
            ID below.
          </p>

          <label
            className="block text-sm mb-2"
            style={{
              color: "#9090a8",
            }}
          >
            {crypto.name} Transaction ID /
            Hash
          </label>

          <input
            type="text"
            value={reference}
            onChange={(e) =>
              setReference(
                e.target.value
              )
            }
            placeholder={`Enter your ${crypto.symbol} transaction ID`}
            className="w-full px-4 py-4 bg-transparent border outline-none"
            style={{
              color: "#f5f0e8",
              borderColor:
                "rgba(212,160,23,0.25)",
            }}
          />


          {error && (

            <div
              className="mt-5 p-4 border text-sm"
              style={{
                color: "#ff8b8b",
                background:
                  "rgba(255,80,80,0.06)",
                borderColor:
                  "rgba(255,80,80,0.15)",
              }}
            >
              {error}
            </div>

          )}


          {message && (

            <div
              className="mt-5 p-5 border"
              style={{
                background:
                  "rgba(212,160,23,0.06)",
                borderColor:
                  "rgba(212,160,23,0.25)",
              }}
            >

              <div className="flex gap-4">

                <div
                  className="w-10 h-10 shrink-0 flex items-center justify-center font-black"
                  style={{
                    background:
                      "rgba(212,160,23,0.12)",
                    color: "#d4a017",
                  }}
                >
                  ✓
                </div>

                <div>

                  <p
                    className="font-black text-base"
                    style={{
                      color: "#f5f0e8",
                    }}
                  >
                    Payment Pending
                  </p>

                  <p
                    className="mt-2 text-sm leading-6"
                    style={{
                      color: "#d8d2c7",
                    }}
                  >
                    Your payment is currently
                    being processed. Please allow
                    up to 5 minutes for your
                    account balance to be updated.
                  </p>

                  <p
                    className="mt-2 text-sm leading-6"
                    style={{
                      color: "#9090a8",
                    }}
                  >
                    For the latest balance, please
                    refresh your dashboard to view
                    your current available balance.
                  </p>

                </div>

              </div>

            </div>

          )}


          {!message && (

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-5 px-6 py-4 font-bold"
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
                ? "Submitting..."
                : "I've Made the Payment"}
            </button>

          )}

        </form>


        <Link
          to="/dashboard/wallet"
          className="inline-flex items-center text-sm"
          style={{
            color: "#d4a017",
          }}
        >
          ← Back to Wallet
        </Link>

      </div>

    </div>
  );
}

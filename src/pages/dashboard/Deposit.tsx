
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

type PaymentMethod = "bank_transfer" | "bitcoin";

export default function Deposit() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [method, setMethod] =
    useState<PaymentMethod>("bank_transfer");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const btcAddress =
    "bc1q9wkkmuna70ulurfmr634z6wvq3atv4s52pgpe7";
  const bankName = "Opay";
  const accountName = "Tohbi Gnf";
  const accountNumber = "7084227994";

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

  async function copyToClipboard(text: string, identifier: string) {
    try {
      // Modern Clipboard API
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(text);
        setCopied(identifier);
        setTimeout(() => setCopied(""), 2000);
        return;
      }

      // Fallback for browsers where Clipboard API is unavailable
      const textarea = document.createElement("textarea");

      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";

      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();

      const successful = document.execCommand("copy");

      document.body.removeChild(textarea);

      if (successful) {
        setCopied(identifier);
        setTimeout(() => setCopied(""), 2000);
      } else {
        throw new Error("Copy command failed");
      }
    } catch (err) {
      console.error("COPY ERROR:", err);
      setError("Unable to copy. Please copy it manually.");
      setMessage("");
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
    })
      } `;
  }

  async function submitDeposit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid deposit amount.");
      return;
    }

    if (numericAmount < 10) {
      setError("Minimum deposit amount is $10.");
      return;
    }

    if (!reference.trim()) {
      setError(
        method === "bank_transfer"
          ? "Please enter your bank transfer reference."
          : "Please enter your Bitcoin transaction ID/hash."
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

      const { error: depositError } = await supabase
        .from("deposits")
        .insert({
          user_id: user.id,
          amount: numericAmount,
          currency: "USD",
          provider: method,
          provider_reference: reference.trim(),
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
          } `
        );

        return;
      }

      setAmount("");
      setReference("");

      setMessage(
        "Deposit submitted successfully. Your transfer will be reviewed before your wallet is credited."
      );
    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

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
          Fund your wallet using Bitcoin or bank
          transfer.
        </p>

      </div>

      <div className="max-w-3xl space-y-5">

        {/* PAYMENT METHOD */}

        <section>

          <h2 className="text-lg font-bold mb-3">
            Choose Payment Method
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* BANK */}

            <button
              type="button"
              onClick={() => {
                setMethod("bank_transfer");
                setReference("");
                setError("");
              }}
              className="text-left p-5 border transition-all"
              style={{
                background:
                  method === "bank_transfer"
                    ? "rgba(212,160,23,0.08)"
                    : "#111118",
                borderColor:
                  method === "bank_transfer"
                    ? "#d4a017"
                    : "rgba(212,160,23,0.15)",
              }}
            >

              <div className="flex items-center gap-3">

                <div
                  className="w-11 h-11 flex items-center justify-center text-xl"
                  style={{
                    background:
                      "rgba(212,160,23,0.12)",
                    color: "#d4a017",
                  }}
                >
                  🏦
                </div>

                <div>

                  <p className="font-bold">
                    Bank Transfer
                  </p>

                  <p
                    className="text-xs mt-1"
                    style={{ color: "#9090a8" }}
                  >
                    Transfer directly to our bank
                  </p>

                </div>

              </div>

            </button>

            {/* BITCOIN */}

            <button
              type="button"
              onClick={() => {
                setMethod("bitcoin");
                setReference("");
                setError("");
              }}
              className="text-left p-5 border transition-all"
              style={{
                background:
                  method === "bitcoin"
                    ? "rgba(212,160,23,0.08)"
                    : "#111118",
                borderColor:
                  method === "bitcoin"
                    ? "#d4a017"
                    : "rgba(212,160,23,0.15)",
              }}
            >

              <div className="flex items-center gap-3">

                <div
                  className="w-11 h-11 flex items-center justify-center text-xl"
                  style={{
                    background:
                      "rgba(212,160,23,0.12)",
                    color: "#d4a017",
                  }}
                >
                  ₿
                </div>

                <div>

                  <p className="font-bold">
                    Bitcoin
                  </p>

                  <p
                    className="text-xs mt-1"
                    style={{ color: "#9090a8" }}
                  >
                    Send Bitcoin to our wallet
                  </p>

                </div>

              </div>

            </button>

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
            style={{ color: "#9090a8" }}
          >
            Deposit Amount
          </label>

          <div className="relative">

            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold"
              style={{ color: "#d4a017" }}
            >
              $
            </span>

            <input
              type="number"
              min="10"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
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

        </div>


        {/* EXACT AMOUNT WARNING */}

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
                style={{ color: "#e8b830" }}
              >
                Transfer Exact Amount
              </p>

              <p
                className="mt-2 text-sm leading-6"
                style={{ color: "#d8d2c7" }}
              >
                Transfer exactly{" "}
                <strong
                  style={{ color: "#f5f0e8" }}
                >
                  {formattedAmount()}
                </strong>
                . Do not send more or less than
                the amount entered above.
              </p>

              <p
                className="mt-2 text-xs leading-5"
                style={{ color: "#9090a8" }}
              >
                Incorrect amounts may require
                manual verification and can delay
                the crediting of your wallet.
              </p>

            </div>

          </div>

        </div>


        {/* BANK DETAILS */}

        {method === "bank_transfer" && (

          <div
            className="p-5 sm:p-6 border"
            style={{
              background: "#111118",
              borderColor:
                "rgba(212,160,23,0.2)",
            }}
          >

            <div className="flex items-center justify-between gap-3 mb-5">

              <div>

                <h2 className="text-xl font-bold">
                  Bank Transfer
                </h2>

                <p
                  className="text-xs mt-1"
                  style={{ color: "#9090a8" }}
                >
                  Use the details below to make
                  your transfer.
                </p>

              </div>

              <span
                className="px-3 py-1 text-xs font-bold"
                style={{
                  background:
                    "rgba(212,160,23,0.1)",
                  color: "#d4a017",
                }}
              >
                USD
              </span>

            </div>

            <div className="space-y-4">

              <PaymentDetail
                label="Bank"
                value={bankName}
              />

              <PaymentDetail
                label="Account Name"
                value={accountName}
              />

              <div>

                <p
                  className="text-xs mb-2"
                  style={{ color: "#777789" }}
                >
                  Account Number
                </p>

                <div className="flex items-center gap-2">

                  <div
                    className="flex-1 min-w-0 px-4 py-3 border font-mono text-sm"
                    style={{
                      background: "#09090e",
                      borderColor:
                        "rgba(212,160,23,0.15)",
                    }}
                  >
                    {accountNumber}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        accountNumber,
                        "account"
                      )
                    }
                    className="px-4 py-3 text-sm font-bold shrink-0"
                    style={{
                      background:
                        copied === "account"
                          ? "#5dcc8a"
                          : "#d4a017",
                      color: "#09090e",
                    }}
                  >
                    {copied === "account"
                      ? "✓ Copied"
                      : "Copy"}
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}


        {/* BITCOIN DETAILS */}

        {method === "bitcoin" && (

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
                className="w-11 h-11 flex items-center justify-center text-xl"
                style={{
                  background:
                    "rgba(212,160,23,0.12)",
                  color: "#d4a017",
                }}
              >
                ₿
              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Bitcoin Payment
                </h2>

                <p
                  className="text-xs mt-1"
                  style={{ color: "#9090a8" }}
                >
                  Send only BTC to this address.
                </p>

              </div>

            </div>

            <div>

              <p
                className="text-xs mb-2"
                style={{ color: "#777789" }}
              >
                BTC WALLET ADDRESS           </p>

              <div className="flex flex-col sm:flex-row gap-2">

                <div
                  className="flex-1 min-w-0 px-4 py-4 border font-mono text-xs sm:text-sm break-all"
                  style={{
                    background: "#09090e",
                    borderColor:
                      "rgba(212,160,23,0.15)",
                  }}
                >
                  {btcAddress}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      btcAddress,
                      "bitcoin"
                    )
                  }
                  className="px-5 py-3 font-bold shrink-0"
                  style={{
                    background:
                      copied === "bitcoin"
                        ? "#5dcc8a"
                        : "#d4a017",
                    color: "#09090e",
                  }}
                >
                  {copied === "bitcoin"
                    ? "✓ Copied"
                    : "Copy Address"}
                </button>

              </div>

            </div>

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
              ⚠️ Send only Bitcoin (BTC) to the
              address above. Sending another
              cryptocurrency or using an incorrect
              network may result in permanent loss.
            </div>

          </div>

        )}


        {/* SUBMISSION FORM */}

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
            Confirm Payment
          </h2>

          <p
            className="text-sm mt-1 mb-5"
            style={{ color: "#9090a8" }}
          >
            After completing your transfer, enter
            the transaction details below.
          </p>

          <div>

            <label
              className="block text-sm mb-2"
              style={{ color: "#9090a8" }}
            >
              {method === "bank_transfer"
                ? "Bank Transfer Reference"
                : "Bitcoin Transaction ID / Hash"}
            </label>

            <input
              type="text"
              value={reference}
              onChange={(e) =>
                setReference(e.target.value)
              }
              placeholder={
                method === "bank_transfer"
                  ? "Enter your transfer reference"
                  : "Enter your Bitcoin transaction ID"
              }
              className="w-full px-4 py-4 bg-transparent border outline-none"
              style={{
                color: "#f5f0e8",
                borderColor:
                  "rgba(212,160,23,0.25)",
              }}
            />

          </div>


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
              className="mt-5 p-4 border text-sm"
              style={{
                color: "#71d69a",
                background:
                  "rgba(50,180,100,0.06)",
                borderColor:
                  "rgba(50,180,100,0.2)",
              }}
            >
              {message}
            </div>

          )}


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

        </form>


        <Link
          to="/dashboard/wallet"
          className="inline-flex items-center text-sm"
          style={{ color: "#d4a017" }}
        >
          ← Back to Wallet
        </Link>

      </div>

    </div>
  );
}


/* PAYMENT DETAIL */

function PaymentDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p
        className="text-xs"
        style={{ color: "#777789" }}
      >
        {label}
      </p>

      <p className="font-semibold mt-1 break-words">
        {value}
      </p>

    </div>
  );
}
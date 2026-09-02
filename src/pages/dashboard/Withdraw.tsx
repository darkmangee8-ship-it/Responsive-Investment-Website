import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

type Wallet = {
  available_balance: number;
  total_profit: number;
};

type WithdrawalResult = {
  withdrawal_id: string;
  amount: number;
  status: string;
};

type WithdrawalMethod = "bank" | "crypto";

type CryptoAsset =
  | "BTC"
  | "USDT"
  | "USDC"
  | "DAI";

export default function Withdraw() {
  const navigate = useNavigate();

  const [wallet, setWallet] = useState<Wallet | null>(null);

  const [method, setMethod] =
    useState<WithdrawalMethod>("bank");

  const [amount, setAmount] = useState("");

  // Bank details
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");

  // Crypto details
  const [cryptoAsset, setCryptoAsset] =
    useState<CryptoAsset>("USDT");
  const [cryptoNetwork, setCryptoNetwork] =
    useState("TRC20");
  const [cryptoAddress, setCryptoAddress] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] =
    useState<WithdrawalResult | null>(null);

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("wallets")
        .select(
          "available_balance, total_profit"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("WALLET ERROR:", error);
        setError(
          "Unable to load your wallet balance."
        );
        return;
      }

      setWallet(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load your wallet.");
    } finally {
      setLoading(false);
    }
  }

  const totalBalance =
    Number(wallet?.available_balance ?? 0) +
    Number(wallet?.total_profit ?? 0);

  async function submitWithdrawal(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError(
        "Please enter a valid withdrawal amount."
      );
      return;
    }

    if (numericAmount < 5000) {
      setError(
        "Minimum withdrawal amount is $5000."
      );
      return;
    }

    if (numericAmount > totalBalance) {
      setError(
        `Insufficient balance.Your total balance is ${money(
          totalBalance
        )
        }.`
      );
      return;
    }

    /*
     * BANK VALIDATION
     */
    if (method === "bank") {
      if (!accountName.trim()) {
        setError(
          "Please enter the account name."
        );
        return;
      }

      if (!accountNumber.trim()) {
        setError(
          "Please enter the account number."
        );
        return;
      }

      if (!bankName.trim()) {
        setError(
          "Please enter the bank name."
        );
        return;
      }

      if (accountNumber.trim().length < 5) {
        setError(
          "Please enter a valid account number."
        );
        return;
      }
    }

    /*
     * CRYPTO VALIDATION
     */
    if (method === "crypto") {
      if (!cryptoAddress.trim()) {
        setError(
          "Please enter your cryptocurrency wallet address."
        );
        return;
      }

      if (cryptoAddress.trim().length < 20) {
        setError(
          "Please enter a valid cryptocurrency wallet address."
        );
        return;
      }

      if (!cryptoNetwork) {
        setError(
          "Please select a cryptocurrency network."
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      /*
       * Create the destination information.
       *
       * The actual crypto transfer should be handled
       * by your approved payment/crypto provider.
       */
      let destination = "";

      if (method === "bank") {
        destination =
          `Method: BANK | ` +
          `Bank: ${bankName.trim()} | ` +
          `Account Name: ${accountName.trim()} | ` +
          `Account Number: ${accountNumber.trim()} `;
      } else {
        destination =
          `Method: CRYPTO | ` +
          `Asset: ${cryptoAsset} | ` +
          `Network: ${cryptoNetwork} | ` +
          `Address: ${cryptoAddress.trim()} `;
      }

      /*
       * Submit the withdrawal request.
       *
       * Your Supabase RPC should perform the database
       * balance deduction atomically.
       */
      const { data, error } =
        await supabase.rpc(
          "request_withdrawal",
          {
            p_amount: numericAmount,
            p_destination: destination,
          }
        );

      if (error) {
        console.error(
          "WITHDRAWAL ERROR:",
          error
        );

        setError(
          error.message ||
          "Unable to submit withdrawal."
        );

        return;
      }

      setSuccess(
        data as WithdrawalResult
      );

      setAmount("");

      setAccountName("");
      setAccountNumber("");
      setBankName("");

      setCryptoAddress("");

      await loadWallet();
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function money(
    value: number | null | undefined
  ) {
    return `$${Number(value ?? 0).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )
      } `;
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p
          className="text-sm"
          style={{ color: "#9090a8" }}
        >
          Loading your wallet...
        </p>
      </div>
    );
  }

  /*
   * SUCCESS SCREEN
   */
  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div
          className="p-8 md:p-12 border text-center"
          style={{
            background: "#111118",
            borderColor:
              "rgba(50,180,100,0.25)",
          }}
        >
          <div
            className="mx-auto w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background:
                "rgba(50,180,100,0.12)",
              border:
                "2px solid rgba(50,180,100,0.35)",
            }}
          >
            <span
              className="text-5xl font-black"
              style={{ color: "#5dcc8a" }}
            >
              ✓
            </span>
          </div>

          <p
            className="mt-7 text-xs uppercase tracking-[0.25em] font-bold"
            style={{ color: "#5dcc8a" }}
          >
            Withdrawal Succsessfull
          </p>

          <h1
            className="mt-3 text-4xl md:text-5xl font-black"
            style={{ color: "#5dcc8a" }}
          >
            Withdrawed
          </h1>

          <p
            className="mt-4 text-3xl font-black"
            style={{ color: "#f5f0e8" }}
          >
            {money(success.amount)}
          </p>

          <div
            className="mt-8 p-5 text-left border"
            style={{
              background:
                "rgba(255,255,255,0.02)",
              borderColor:
                "rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex justify-between gap-4 py-2">
              <span
                className="text-sm"
                style={{ color: "#9090a8" }}
              >
                Status
              </span>

              <span
                className="text-sm font-bold"
                style={{ color: "#d4a017" }}
              >
                {success.status}
              </span>
            </div>

            <div className="flex justify-between gap-4 py-2">
              <span
                className="text-sm"
                style={{ color: "#9090a8" }}
              >
                Amount
              </span>

              <span className="text-sm font-bold">
                {money(success.amount)}
              </span>
            </div>
          </div>

          <div
            className="mt-6 p-5 border text-left"
            style={{
              background:
                "rgba(50,180,100,0.06)",
              borderColor:
                "rgba(50,180,100,0.2)",
            }}
          >
            <p
              className="text-sm font-bold"
              style={{ color: "#5dcc8a" }}
            >
              Withdrawal Processing
            </p>

            <p
              className="mt-2 text-sm leading-6"
              style={{ color: "#c7c2b8" }}
            >
              Your withdrawal request has been
              received and is currently being
              processed. You can monitor its status
              from your transaction history.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              to="/dashboard"
              className="flex-1 px-6 py-4 font-bold text-center"
              style={{
                background: "#d4a017",
                color: "#09090e",
              }}
            >
              Back to Dashboard
            </Link>

            <Link
              to="/dashboard/transactions"
              className="flex-1 px-6 py-4 font-bold text-center border"
              style={{
                borderColor:
                  "rgba(212,160,23,0.25)",
                color: "#d4a017",
              }}
            >
              View Transactions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p
          className="text-xs uppercase tracking-widest font-semibold mb-3"
          style={{ color: "#d4a017" }}
        >
          Wallet
        </p>

        <h1 className="text-3xl font-black">
          Withdraw
        </h1>

        <p
          className="mt-2 text-sm"
          style={{ color: "#9090a8" }}
        >
          Withdraw funds to your preferred
          destination.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* TOTAL BALANCE */}
        <div
          className="p-6 border"
          style={{
            background: "#111118",
            borderColor:
              "rgba(212,160,23,0.2)",
          }}
        >
          <p
            className="text-sm"
            style={{ color: "#9090a8" }}
          >
            Total Balance
          </p>

          <p
            className="mt-2 text-3xl font-black"
            style={{ color: "#d4a017" }}
          >
            {money(totalBalance)}
          </p>

          <p
            className="mt-2 text-xs"
            style={{ color: "#777789" }}
          >
            Available Balance + Total Profit
          </p>
        </div>

        {/* WITHDRAWAL METHOD */}
        <div
          className="p-6 border"
          style={{
            background: "#111118",
            borderColor:
              "rgba(212,160,23,0.2)",
          }}
        >
          <h2 className="text-xl font-bold">
            Withdrawal Method
          </h2>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              type="button"
              onClick={() => setMethod("bank")}
              className="p-4 border text-left"
              style={{
                borderColor:
                  method === "bank"
                    ? "#d4a017"
                    : "rgba(255,255,255,0.08)",
                background:
                  method === "bank"
                    ? "rgba(212,160,23,0.08)"
                    : "rgba(255,255,255,0.02)",
              }}
            >
              <p className="font-bold">
                Bank Account
              </p>

              <p
                className="text-xs mt-1"
                style={{ color: "#9090a8" }}
              >
                Withdraw to your bank
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMethod("crypto")}
              className="p-4 border text-left"
              style={{
                borderColor:
                  method === "crypto"
                    ? "#d4a017"
                    : "rgba(255,255,255,0.08)",
                background:
                  method === "crypto"
                    ? "rgba(212,160,23,0.08)"
                    : "rgba(255,255,255,0.02)",
              }}
            >
              <p className="font-bold">
                Cryptocurrency
              </p>

              <p
                className="text-xs mt-1"
                style={{ color: "#9090a8" }}
              >
                Use a supported crypto asset
              </p>
            </button>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={submitWithdrawal}
          className="p-6 border"
          style={{
            background: "#111118",
            borderColor:
              "rgba(212,160,23,0.2)",
          }}
        >
          <h2 className="text-xl font-bold">
            Withdrawal Details
          </h2>

          <div className="space-y-5 mt-7">

            {/* AMOUNT */}
            <div>
              <label
                className="block text-sm mb-2"
                style={{ color: "#9090a8" }}
              >
                Withdrawal Amount
              </label>

              <input
                type="number"
                min="5000"
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="5000"
                className="w-full px-4 py-4 bg-transparent border outline-none"
                style={{
                  color: "#f5f0e8",
                  borderColor:
                    "rgba(212,160,23,0.25)",
                }}
              />

              <p
                className="mt-2 text-xs"
                style={{ color: "#777789" }}
              >
                Minimum withdrawal: $5,000
              </p>
            </div>

            {/* BANK FIELDS */}
            {method === "bank" && (
              <>
                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ color: "#9090a8" }}
                  >
                    Account Name
                  </label>

                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) =>
                      setAccountName(
                        e.target.value
                      )
                    }
                    placeholder="Enter Account Name"
                    className="w-full px-4 py-4 bg-transparent border outline-none"
                    style={{
                      color: "#f5f0e8",
                      borderColor:
                        "rgba(212,160,23,0.25)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ color: "#9090a8" }}
                  >
                    Account Number
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={accountNumber}
                    onChange={(e) =>
                      setAccountNumber(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    placeholder="Enter Account Number"
                    className="w-full px-4 py-4 bg-transparent border outline-none"
                    style={{
                      color: "#f5f0e8",
                      borderColor:
                        "rgba(212,160,23,0.25)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ color: "#9090a8" }}
                  >
                    Bank Name
                  </label>

                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) =>
                      setBankName(e.target.value)
                    }
                    placeholder="Enter Bank Name"
                    className="w-full px-4 py-4 bg-transparent border outline-none"
                    style={{
                      color: "#f5f0e8",
                      borderColor:
                        "rgba(212,160,23,0.25)",
                    }}
                  />
                </div>
              </>
            )}

            {/* CRYPTO FIELDS */}
            {method === "crypto" && (
              <>
                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ color: "#9090a8" }}
                  >
                    Cryptocurrency
                  </label>

                  <select
                    value={cryptoAsset}
                    onChange={(e) =>
                      setCryptoAsset(
                        e.target.value as CryptoAsset
                      )
                    }
                    className="w-full px-4 py-4 bg-[#111118] border outline-none"
                    style={{
                      color: "#f5f0e8",
                      borderColor:
                        "rgba(212,160,23,0.25)",
                    }}
                  >
                    <option value="USDT">
                      USDT
                    </option>
                    <option value="USDC">
                      USDC
                    </option>
                    <option value="BTC">
                      Bitcoin (BTC)
                    </option>
                    <option value="DAI">
                      DAI
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ color: "#9090a8" }}
                  >
                    Network
                  </label>

                  <select
                    value={cryptoNetwork}
                    onChange={(e) =>
                      setCryptoNetwork(
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-4 bg-[#111118] border outline-none"
                    style={{
                      color: "#f5f0e8",
                      borderColor:
                        "rgba(212,160,23,0.25)",
                    }}
                  >
                    <option value="TRC20">
                      TRON (TRC20)
                    </option>
                    <option value="ERC20">
                      Ethereum (ERC20)
                    </option>
                    <option value="BEP20">
                      BNB Smart Chain (BEP20)
                    </option>
                    <option value="BTC">
                      Bitcoin Network
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ color: "#9090a8" }}
                  >
                    Wallet Address
                  </label>

                  <input
                    type="text"
                    value={cryptoAddress}
                    onChange={(e) =>
                      setCryptoAddress(
                        e.target.value
                      )
                    }
                    placeholder="Enter your wallet address"
                    className="w-full px-4 py-4 bg-transparent border outline-none"
                    style={{
                      color: "#f5f0e8",
                      borderColor:
                        "rgba(212,160,23,0.25)",
                    }}
                  />

                  <p
                    className="mt-2 text-xs"
                    style={{ color: "#777789" }}
                  >
                    Make sure the selected network
                    matches your wallet address.
                  </p>
                </div>
              </>
            )}

            {/* WARNING */}
            <div
              className="p-4 border"
              style={{
                background:
                  "rgba(212,160,23,0.06)",
                borderColor:
                  "rgba(212,160,23,0.25)",
              }}
            >
              <p
                className="text-sm font-bold"
                style={{ color: "#d4a017" }}
              >
                ⚠ Important
              </p>

              <p
                className="mt-2 text-sm leading-6"
                style={{ color: "#c7c2b8" }}
              >
                Verify all withdrawal details before
                submitting your request. Cryptocurrency
                transfers are especially sensitive to
                incorrect network or wallet information.
              </p>
            </div>

            {/* ERROR */}
            {error && (
              <div
                className="p-4 border text-sm"
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

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-4 font-bold"
              style={{
                background: submitting
                  ? "#6d5a1f"
                  : "#d4a017",
                color: "#09090e",
                cursor: submitting
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {submitting
                ? "Processing Withdrawal..."
                : "Withdraw Funds"}
            </button>
          </div>
        </form>

        <Link
          to="/dashboard/wallet"
          className="inline-block text-sm"
          style={{ color: "#d4a017" }}
        >
          ← Back to Wallet
        </Link>
      </div>
    </div>
  );
}
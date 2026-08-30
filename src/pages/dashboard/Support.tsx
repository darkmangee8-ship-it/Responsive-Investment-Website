import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabase";

type SupportRequest = {
  id: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
};

export default function Support() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [requests, setRequests] = useState<SupportRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSupportRequests();
  }, []);

  async function loadSupportRequests() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to view support requests.");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("support_requests")
        .select(
          "id, subject, message, status, admin_reply, created_at, replied_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("SUPPORT LOAD ERROR:", fetchError);
        setError(fetchError.message);
        return;
      }

      setRequests(data ?? []);
    } catch (err) {
      console.error("SUPPORT ERROR:", err);
      setError("Unable to load your support requests.");
    } finally {
      setLoading(false);
    }
  }

  async function submitSupportRequest(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSuccess("");
    setError("");

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanSubject) {
      setError("Please enter a subject.");
      return;
    }

    if (!cleanMessage) {
      setError("Please describe the problem you are experiencing.");
      return;
    }

    if (cleanMessage.length < 10) {
      setError(
        "Please provide a little more information about your problem."
      );
      return;
    }

    setSending(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Your session has expired. Please log in again.");
        return;
      }

      const { error: insertError } = await supabase
        .from("support_requests")
        .insert({
          user_id: user.id,
          subject: cleanSubject,
          message: cleanMessage,
          status: "OPEN",
        });

      if (insertError) {
        console.error(
          "SUPPORT INSERT ERROR:",
          insertError
        );

        setError(
          `Unable to send your support request: ${insertError.message || "Unknown database error"
          }`
        );

        return;
      }

      setSubject("");
      setMessage("");

      setSuccess(
        "Your support request has been sent successfully. Our support team will review it and respond as soon as possible."
      );

      await loadSupportRequests();
    } catch (err) {
      console.error("SUPPORT SUBMIT ERROR:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function getStatusStyle(status: SupportRequest["status"]) {
    switch (status) {
      case "RESOLVED":
        return {
          color: "#5dcc8a",
          background: "rgba(93,204,138,0.08)",
          borderColor: "rgba(93,204,138,0.2)",
        };

      case "IN_PROGRESS":
        return {
          color: "#d4a017",
          background: "rgba(212,160,23,0.08)",
          borderColor: "rgba(212,160,23,0.2)",
        };

      default:
        return {
          color: "#8fb8ff",
          background: "rgba(80,140,255,0.08)",
          borderColor: "rgba(80,140,255,0.2)",
        };
    }
  }

  function formatStatus(status: SupportRequest["status"]) {
    switch (status) {
      case "IN_PROGRESS":
        return "IN PROGRESS";

      case "RESOLVED":
        return "RESOLVED";

      default:
        return "OPEN";
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* HEADER */}
      <div className="mb-8">
        <p
          className="text-xs uppercase tracking-[0.2em] font-semibold mb-3"
          style={{ color: "#d4a017" }}
        >
          Help & Support
        </p>

        <h1 className="text-3xl lg:text-4xl font-black">
          How can we help?
        </h1>

        <p
          className="mt-3 text-sm max-w-2xl leading-6"
          style={{ color: "#9090a8" }}
        >
          Have a problem with your account, deposit, withdrawal,
          investment, or anything else? Send us a message and our
          support team will assist you.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">

        {/* SUPPORT FORM */}
        <form
          onSubmit={submitSupportRequest}
          className="border p-6 lg:p-8"
          style={{
            background: "#111118",
            borderColor: "rgba(212,160,23,0.15)",
          }}
        >
          <div className="flex items-center gap-4 mb-7">

            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(212,160,23,0.1)",
                color: "#d4a017",
              }}
            >
              <span className="text-xl">?</span>
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Contact Support
              </h2>

              <p
                className="text-xs mt-1"
                style={{ color: "#777789" }}
              >
                Tell us what you need help with.
              </p>
            </div>

          </div>

          {/* SUBJECT */}
          <div className="mb-5">
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#c7c2b8" }}
            >
              Subject
            </label>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Withdrawal problem"
              maxLength={120}
              className="w-full px-4 py-4 border outline-none transition"
              style={{
                background: "#0d0d14",
                color: "#f5f0e8",
                borderColor: "rgba(212,160,23,0.2)",
              }}
            />
          </div>

          {/* MESSAGE */}
          <div className="mb-5">
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#c7c2b8" }}
            >
              Message
            </label>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your problem or question..."
              rows={7}
              maxLength={2000}
              className="w-full px-4 py-4 border outline-none resize-none transition"
              style={{
                background: "#0d0d14",
                color: "#f5f0e8",
                borderColor: "rgba(212,160,23,0.2)",
              }}
            />

            <div
              className="text-right text-xs mt-2"
              style={{ color: "#666678" }}
            >
              {message.length}/2000
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div
              className="p-4 border mb-5 text-sm leading-6"
              style={{
                color: "#ff8b8b",
                background: "rgba(255,80,80,0.06)",
                borderColor: "rgba(255,80,80,0.18)",
              }}
            >
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div
              className="p-4 border mb-5 text-sm leading-6"
              style={{
                color: "#5dcc8a",
                background: "rgba(93,204,138,0.06)",
                borderColor: "rgba(93,204,138,0.2)",
              }}
            >
              {success}
            </div>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={sending}
            className="w-full px-6 py-4 font-bold transition"
            style={{
              background: sending ? "#6d5a1f" : "#d4a017",
              color: "#09090e",
              cursor: sending ? "not-allowed" : "pointer",
            }}
          >
            {sending ? "Sending Request..." : "Send to Support"}
          </button>
        </form>

        {/* INFORMATION CARD */}
        <div className="space-y-6">

          <div
            className="border p-6"
            style={{
              background: "#111118",
              borderColor: "rgba(212,160,23,0.15)",
            }}
          >
            <h2 className="text-lg font-bold mb-5">
              Support Information
            </h2>

            <div className="space-y-5">

              <div className="flex gap-4">
                <div
                  className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center"
                  style={{
                    background: "rgba(212,160,23,0.08)",
                    color: "#d4a017",
                  }}
                >
                  1
                </div>

                <div>
                  <p className="font-semibold text-sm">
                    Submit your problem
                  </p>

                  <p
                    className="text-xs mt-1 leading-5"
                    style={{ color: "#777789" }}
                  >
                    Explain the issue clearly so our team can
                    understand what happened.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div
                  className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center"
                  style={{
                    background: "rgba(212,160,23,0.08)",
                    color: "#d4a017",
                  }}
                >
                  2
                </div>

                <div>
                  <p className="font-semibold text-sm">
                    Support reviews it
                  </p>

                  <p
                    className="text-xs mt-1 leading-5"
                    style={{ color: "#777789" }}
                  >
                    Your request will appear in the admin support
                    panel for review.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div
                  className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center"
                  style={{
                    background: "rgba(212,160,23,0.08)",
                    color: "#d4a017",
                  }}
                >
                  3
                </div>

                <div>
                  <p className="font-semibold text-sm">
                    Receive a response
                  </p>

                  <p
                    className="text-xs mt-1 leading-5"
                    style={{ color: "#777789" }}
                  >
                    Once an administrator responds, the reply will
                    appear below in your support history.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* SECURITY NOTICE */}
          <div
            className="border p-5"
            style={{
              background: "rgba(212,160,23,0.04)",
              borderColor: "rgba(212,160,23,0.15)",
            }}
          >
            <p
              className="text-xs uppercase tracking-widest font-semibold mb-2"
              style={{ color: "#d4a017" }}
            >
              Security
            </p>

            <p
              className="text-sm leading-6"
              style={{ color: "#a5a1a0" }}
            >
              Never send your password, authentication codes, or
              private security information through support messages.
            </p>
          </div>

        </div>
      </div>

      {/* SUPPORT HISTORY */}
      <div className="mt-10">

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">
              Your Support Requests
            </h2>

            <p
              className="text-sm mt-1"
              style={{ color: "#777789" }}
            >
              Track your previous messages and administrator replies.
            </p>
          </div>
        </div>

        {loading ? (
          <div
            className="border p-8 text-center text-sm"
            style={{
              background: "#111118",
              borderColor: "rgba(212,160,23,0.15)",
              color: "#777789",
            }}
          >
            Loading support history...
          </div>
        ) : requests.length === 0 ? (
          <div
            className="border p-8 text-center"
            style={{
              background: "#111118",
              borderColor: "rgba(212,160,23,0.15)",
            }}
          >
            <div
              className="text-3xl mb-3"
              style={{ color: "#d4a017" }}
            >
              ?
            </div>

            <p className="font-semibold">
              No support requests yet
            </p>

            <p
              className="text-sm mt-2"
              style={{ color: "#777789" }}
            >
              If you need help, send a message using the form above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {requests.map((request) => {
              const statusStyle = getStatusStyle(request.status);

              return (
                <div
                  key={request.id}
                  className="border p-5 lg:p-6"
                  style={{
                    background: "#111118",
                    borderColor: "rgba(212,160,23,0.12)",
                  }}
                >

                  {/* REQUEST HEADER */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                    <div>
                      <h3 className="font-bold text-base">
                        {request.subject}
                      </h3>

                      <p
                        className="text-xs mt-2"
                        style={{ color: "#666678" }}
                      >
                        Submitted {formatDate(request.created_at)}
                      </p>
                    </div>

                    <span
                      className="inline-flex self-start px-3 py-2 border text-[10px] font-bold tracking-wider"
                      style={{
                        color: statusStyle.color,
                        background: statusStyle.background,
                        borderColor: statusStyle.borderColor,
                      }}
                    >
                      {formatStatus(request.status)}
                    </span>

                  </div>

                  {/* USER MESSAGE */}
                  <div
                    className="mt-5 p-4 border"
                    style={{
                      background: "#0d0d14",
                      borderColor: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-widest mb-2"
                      style={{ color: "#666678" }}
                    >
                      Your message
                    </p>

                    <p
                      className="text-sm leading-6 whitespace-pre-wrap"
                      style={{ color: "#c7c2b8" }}
                    >
                      {request.message}
                    </p>
                  </div>

                  {/* ADMIN REPLY */}
                  {request.admin_reply && (
                    <div
                      className="mt-4 p-4 border"
                      style={{
                        background: "rgba(93,204,138,0.04)",
                        borderColor: "rgba(93,204,138,0.15)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">

                        <p
                          className="text-[10px] uppercase tracking-widest font-semibold"
                          style={{ color: "#5dcc8a" }}
                        >
                          Support Response
                        </p>

                        {request.replied_at && (
                          <p
                            className="text-[10px]"
                            style={{ color: "#666678" }}
                          >
                            {formatDate(request.replied_at)}
                          </p>
                        )}

                      </div>

                      <p
                        className="text-sm leading-6 whitespace-pre-wrap"
                        style={{ color: "#c7c2b8" }}
                      >
                        {request.admin_reply}
                      </p>
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}
      </div>

      {/* BACK */}
      <div className="mt-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium"
          style={{ color: "#d4a017" }}
        >
          ← Back to Dashboard
        </Link>
      </div>

    </div>
  );
}
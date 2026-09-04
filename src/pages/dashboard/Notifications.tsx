import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Notification | null>(null);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        () => {
          loadNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadNotifications() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to view notifications.");
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("id,user_id,title,message,read,created_at")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("NOTIFICATIONS ERROR:", error);
        setError(error.message);
        return;
      }

      setNotifications((data ?? []) as Notification[]);
    } catch (err) {
      console.error(err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function openNotification(notification: Notification) {
    setSelected(notification);

    if (!notification.read) {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notification.id);

      if (error) {
        console.error("MARK READ ERROR:", error);
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, read: true }
            : item
        )
      );
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function isWithdrawal(notification: Notification) {
    return (
      notification.title.toLowerCase().includes("withdrawal") ||
      notification.message.toLowerCase().includes("withdrawal")
    );
  }

  function isWithdrawalConfirmed(notification: Notification) {
    const text =
      `${notification.title} ${notification.message} `.toLowerCase();

    return (
      isWithdrawal(notification) &&
      (text.includes("confirmed") ||
        text.includes("completed") ||
        text.includes("approved"))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 sm:py-20">
        <p style={{ color: "#9090a8" }}>
          Loading notifications...
        </p>
      </div>
    );
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <div className="w-full min-w-0">

      {/* HEADER */}

      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">

          <h1 className="text-2xl sm:text-3xl font-black">
            Notifications
          </h1>

          {unreadCount > 0 && (
            <span
              className="min-w-5 h-5 sm:min-w-6 sm:h-6 px-1.5 sm:px-2 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0"
              style={{
                background: "#d4a017",
                color: "#09090e",
              }}
            >
              {unreadCount}
            </span>
          )}

        </div>

        <p
          className="mt-2 text-xs sm:text-sm leading-5"
          style={{ color: "#9090a8" }}
        >
          Stay updated about your account and wallet activity.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div
          className="mb-5 sm:mb-6 p-3 sm:p-4 border text-xs sm:text-sm leading-5"
          style={{
            color: "#ff8b8b",
            background: "rgba(255,80,80,0.06)",
            borderColor: "rgba(255,80,80,0.15)",
          }}
        >
          {error}
        </div>
      )}

      {/* EMPTY */}

      {notifications.length === 0 && !error && (
        <div
          className="p-7 sm:p-10 border text-center"
          style={{
            background: "#111118",
            borderColor: "rgba(212,160,23,0.15)",
          }}
        >
          <i
            className="bx bx-bell text-3xl sm:text-4xl"
            style={{ color: "#d4a017" }}
          />

          <h2 className="mt-3 sm:mt-4 text-lg sm:text-xl font-bold">
            No notifications
          </h2>

          <p
            className="mt-2 text-xs sm:text-sm"
            style={{ color: "#9090a8" }}
          >
            You're all caught up.
          </p>
        </div>
      )}

      {/* NOTIFICATION LIST */}

      {notifications.length > 0 && (
        <div
          className="w-full border overflow-hidden"
          style={{
            background: "#111118",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {notifications.map((notification) => {
            const withdrawal = isWithdrawal(notification);
            const confirmed = isWithdrawalConfirmed(notification);

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => openNotification(notification)}
                className="w-full text-left px-3 py-4 sm:p-5 border-b transition-all hover:bg-white/[0.02]"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  background: notification.read
                    ? "transparent"
                    : withdrawal
                      ? "rgba(93,204,138,0.035)"
                      : "rgba(212,160,23,0.035)",
                }}
              >
                <div className="flex items-start gap-2.5 sm:gap-4 min-w-0">

                  {/* ICON */}

                  <div
                    className="w-9 h-9 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-full"
                    style={{
                      background: withdrawal
                        ? "rgba(93,204,138,0.10)"
                        : "rgba(212,160,23,0.08)",
                      border: withdrawal
                        ? "1px solid rgba(93,204,138,0.25)"
                        : "1px solid rgba(212,160,23,0.18)",
                    }}
                  >
                    {withdrawal ? (
                      <i
                        className={
                          confirmed
                            ? "bx bx-check text-xl sm:text-3xl"
                            : "bx bx-up-arrow-circle text-xl sm:text-2xl"
                        }
                        style={{
                          color: "#5dcc8a",
                        }}
                      />
                    ) : (
                      <i
                        className="bx bx-bell text-base sm:text-xl"
                        style={{
                          color: "#d4a017",
                        }}
                      />
                    )}
                  </div>

                  {/* CONTENT */}

                  <div className="flex-1 min-w-0">

                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">

                      <h3 className="font-bold text-sm sm:text-base truncate">
                        {withdrawal && confirmed
                          ? "Withdrawal Confirmed"
                          : notification.title}
                      </h3>

                      {!notification.read && (
                        <span
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0"
                          style={{
                            background: withdrawal
                              ? "#5dcc8a"
                              : "#d4a017",
                          }}
                        />
                      )}

                    </div>

                    <p
                      className="text-xs sm:text-sm mt-1 line-clamp-2 leading-5"
                      style={{
                        color: "#9090a8",
                      }}
                    >
                      {notification.message}
                    </p>

                    <p
                      className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 truncate"
                      style={{
                        color: "#666678",
                      }}
                    >
                      {formatDate(notification.created_at)}
                    </p>

                  </div>

                  {/* VIEW */}

                  <div
                    className="text-[10px] sm:text-xs shrink-0 hidden xs:block sm:block pt-1"
                    style={{
                      color: "#777789",
                    }}
                  >
                    View →
                  </div>

                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* =====================================================
          WITHDRAWAL CONFIRMED NOTIFICATION
      ===================================================== */}

      {selected &&
        isWithdrawal(selected) &&
        isWithdrawalConfirmed(selected) && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            style={{
              background: "rgba(0,0,0,0.82)",
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setSelected(null)}
          >
            <div
              className="w-full max-w-xl border my-3 sm:my-8 max-h-[94vh] sm:max-h-none overflow-y-auto"
              style={{
                background: "#101116",
                borderColor: "rgba(93,204,138,0.18)",
              }}
              onClick={(e) => e.stopPropagation()}
            >

              {/* GREEN CHECK */}

              <div className="flex flex-col items-center text-center pt-7 sm:pt-10 px-4 sm:px-6">

                <div
                  className="w-20 h-20 sm:w-32 sm:h-32 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(93,204,138,0.10)",
                    border: "2px solid rgba(93,204,138,0.38)",
                    boxShadow:
                      "0 0 35px rgba(93,204,138,0.08)",
                  }}
                >
                  <i
                    className="bx bx-check"
                    style={{
                      color: "#5dcc8a",
                      fontSize: "52px",
                      fontWeight: 700,
                    }}
                  />
                </div>

                <p
                  className="mt-6 sm:mt-10 text-[10px] sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.35em] font-bold"
                  style={{
                    color: "#5dcc8a",
                  }}
                >
                  Withdrawal Successful
                </p>

                <h2
                  className="mt-3 sm:mt-5 text-2xl sm:text-4xl md:text-5xl font-black leading-tight"
                  style={{
                    color: "#5dcc8a",
                  }}
                >
                  Withdrawal Confirmed
                </h2>

              </div>

              {/* MESSAGE */}

              <div
                className="mx-3 sm:mx-6 mt-6 sm:mt-10 p-4 sm:p-6 border"
                style={{
                  background: "rgba(93,204,138,0.06)",
                  borderColor: "rgba(93,204,138,0.16)",
                }}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">

                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: "rgba(93,204,138,0.12)",
                    }}
                  >
                    <i
                      className="bx bx-check text-xl sm:text-2xl"
                      style={{
                        color: "#5dcc8a",
                      }}
                    />
                  </div>

                  <h3
                    className="text-sm sm:text-lg font-bold"
                    style={{
                      color: "#5dcc8a",
                    }}
                  >
                    Withdrawal Completed
                  </h3>

                </div>

                <p
                  className="mt-4 sm:mt-5 text-sm sm:text-base leading-6 sm:leading-8 break-words"
                  style={{
                    color: "#d7d3cb",
                  }}
                >
                  {selected.message}
                </p>

              </div>

              {/* DATE */}

              <p
                className="mx-3 sm:mx-6 mt-4 sm:mt-6 text-[10px] sm:text-xs"
                style={{
                  color: "#666678",
                }}
              >
                {formatDate(selected.created_at)}
              </p>

              {/* DONE */}

              <div className="px-3 sm:px-6 pb-5 sm:pb-8 mt-5 sm:mt-7">

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="w-full py-3.5 sm:py-5 text-sm sm:text-lg font-black"
                  style={{
                    background: "#d4a017",
                    color: "#09090e",
                  }}
                >
                  Done
                </button>

              </div>

            </div>
          </div>
        )}

      {/* =====================================================
          OTHER NOTIFICATIONS
      ===================================================== */}

      {selected &&
        !(
          isWithdrawal(selected) &&
          isWithdrawalConfirmed(selected)
        ) && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            style={{
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setSelected(null)}
          >
            <div
              className="w-full max-w-lg border p-4 sm:p-6 my-3 sm:my-8 max-h-[94vh] overflow-y-auto"
              style={{
                background: "#111118",
                borderColor: "rgba(212,160,23,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >

              <div className="flex items-start justify-between gap-3">

                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">

                  <div
                    className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center shrink-0"
                    style={{
                      background: "rgba(212,160,23,0.08)",
                      color: "#d4a017",
                    }}
                  >
                    <i
                      className={`bx ${isWithdrawal(selected)
                          ? "bx-up-arrow-circle"
                          : "bx-bell"
                        } text - lg sm: text - xl`}
                    />
                  </div>

                  <div className="min-w-0">

                    <p
                      className="text-[9px] sm:text-xs uppercase tracking-widest"
                      style={{
                        color: "#d4a017",
                      }}
                    >
                      Notification
                    </p>

                    <h2 className="text-base sm:text-xl font-black mt-1 break-words">
                      {selected.title}
                    </h2>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "#9090a8",
                  }}
                >
                  <i className="bx bx-x text-lg sm:text-xl" />
                </button>

              </div>

              <div
                className="mt-5 sm:mt-6 p-4 sm:p-5 border"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                <p className="text-xs sm:text-sm leading-6 sm:leading-7 break-words">
                  {selected.message}
                </p>
              </div>

              <p
                className="text-[10px] sm:text-xs mt-3 sm:mt-4"
                style={{
                  color: "#666678",
                }}
              >
                {formatDate(selected.created_at)}
              </p>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-full mt-5 sm:mt-6 py-3.5 sm:py-4 text-sm sm:text-base font-bold"
                style={{
                  background: "#d4a017",
                  color: "#09090e",
                }}
              >
                Done
              </button>

            </div>
          </div>
        )}
    </div>
  );
}
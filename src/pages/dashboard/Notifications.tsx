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
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] =
    useState<Notification | null>(null);

  useEffect(() => {
    loadNotifications();

    /*
     * Realtime notifications
     */
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
        .select(
          "id,user_id,title,message,read,created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "NOTIFICATIONS ERROR:",
          error
        );

        setError(error.message);
        return;
      }

      setNotifications(
        (data ?? []) as Notification[]
      );
    } catch (err) {
      console.error(err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function openNotification(
    notification: Notification
  ) {
    setSelected(notification);

    /*
     * Mark notification as read
     */
    if (!notification.read) {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notification.id);

      if (error) {
        console.error(
          "MARK READ ERROR:",
          error
        );
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

  function isWithdrawal(
    notification: Notification
  ) {
    return (
      notification.title
        .toLowerCase()
        .includes("withdrawal") ||
      notification.message
        .toLowerCase()
        .includes("withdrawal")
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
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
    <div>
      {/* HEADER */}

      <div className="mb-8">
        <div className="flex items-center gap-3">

          <h1 className="text-3xl font-black">
            Notifications
          </h1>

          {unreadCount > 0 && (
            <span
              className="min-w-6 h-6 px-2 rounded-full flex items-center justify-center text-xs font-black"
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
          className="mt-2 text-sm"
          style={{ color: "#9090a8" }}
        >
          Stay updated about your account and wallet activity.
        </p>
      </div>

      {error && (
        <div
          className="mb-6 p-4 border text-sm"
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
          className="p-10 border text-center"
          style={{
            background: "#111118",
            borderColor: "rgba(212,160,23,0.15)",
          }}
        >
          <i
            className="bx bx-bell text-4xl"
            style={{ color: "#d4a017" }}
          />

          <h2 className="mt-4 text-xl font-bold">
            No notifications
          </h2>

          <p
            className="mt-2 text-sm"
            style={{ color: "#9090a8" }}
          >
            You're all caught up.
          </p>
        </div>
      )}

      {/* NOTIFICATION LIST */}

      {notifications.length > 0 && (
        <div
          className="border overflow-hidden"
          style={{
            background: "#111118",
            borderColor:
              "rgba(255,255,255,0.08)",
          }}
        >
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() =>
                openNotification(notification)
              }
              className="w-full text-left p-5 border-b transition-all hover:bg-white/[0.02]"
              style={{
                borderColor:
                  "rgba(255,255,255,0.06)",
                background: notification.read
                  ? "transparent"
                  : "rgba(212,160,23,0.035)",
              }}
            >
              <div className="flex items-start gap-4">

                {/* ICON */}

                <div
                  className="w-11 h-11 shrink-0 flex items-center justify-center"
                  style={{
                    background: isWithdrawal(
                      notification
                    )
                      ? "rgba(93,204,138,0.08)"
                      : "rgba(212,160,23,0.08)",
                    color: isWithdrawal(
                      notification
                    )
                      ? "#5dcc8a"
                      : "#d4a017",
                  }}
                >
                  <i
                    className={`bx ${isWithdrawal(notification)
                      ? "bx-up-arrow-circle"
                      : "bx-bell"
                      } text-xl`}
                  />
                </div>

                {/* CONTENT */}

                <div className="flex-1 min-w-0">

                  <div className="flex items-center gap-2">

                    <h3 className="font-bold">
                      {notification.title}
                    </h3>

                    {!notification.read && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: "#d4a017",
                        }}
                      />
                    )}

                  </div>

                  <p
                    className="text-sm mt-1 line-clamp-2"
                    style={{
                      color: "#9090a8",
                    }}
                  >
                    {notification.message}
                  </p>

                  <p
                    className="text-xs mt-2"
                    style={{
                      color: "#666678",
                    }}
                  >
                    {formatDate(
                      notification.created_at
                    )}
                  </p>

                </div>

                <div
                  className="text-xs shrink-0"
                  style={{
                    color: "#777789",
                  }}
                >
                  View →
                </div>

              </div>
            </button>
          ))}
        </div>
      )}

      {/* NOTIFICATION DETAILS */}

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-5"
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg border p-6"
            style={{
              background: "#111118",
              borderColor:
                "rgba(212,160,23,0.2)",
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="flex items-start justify-between gap-4">

              <div className="flex items-center gap-3">

                <div
                  className="w-11 h-11 flex items-center justify-center"
                  style={{
                    background:
                      "rgba(212,160,23,0.08)",
                    color: "#d4a017",
                  }}
                >
                  <i
                    className={`bx ${isWithdrawal(selected)
                      ? "bx-up-arrow-circle"
                      : "bx-bell"
                      } text-xl`}
                  />
                </div>

                <div>
                  <p
                    className="text-xs uppercase tracking-widest"
                    style={{
                      color: "#d4a017",
                    }}
                  >
                    Notification
                  </p>

                  <h2 className="text-xl font-black mt-1">
                    {selected.title}
                  </h2>
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelected(null)
                }
                className="w-9 h-9 flex items-center justify-center"
                style={{
                  background:
                    "rgba(255,255,255,0.04)",
                  color: "#9090a8",
                }}
              >
                <i className="bx bx-x text-xl" />
              </button>

            </div>

            <div
              className="mt-6 p-5 border"
              style={{
                background:
                  "rgba(255,255,255,0.02)",
                borderColor:
                  "rgba(255,255,255,0.07)",
              }}
            >
              <p className="text-sm leading-7">
                {selected.message}
              </p>
            </div>

            <p
              className="text-xs mt-4"
              style={{
                color: "#666678",
              }}
            >
              {formatDate(
                selected.created_at
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                setSelected(null)
              }
              className="w-full mt-6 py-4 font-bold"
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
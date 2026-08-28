
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Unable to identify your account.");
        return;
      }

      const { data, error: notificationError } = await supabase
        .from("notifications")
        .select("id, title, message, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (notificationError) {
        console.error("Notifications error:", notificationError);
        setError("Unable to load your notifications.");
        return;
      }

      setNotifications(data ?? []);
    } catch (err) {
      console.error("Notification error:", err);
      setError("Unable to load your notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      console.error("Mark as read error:", error);
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }

  async function markAllAsRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      console.error("Mark all as read error:", error);
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <div className="pb-24 lg:pb-0">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">

        <div>
          <h1 className="text-3xl font-black">
            Notifications
          </h1>

          <p
            className="mt-2 text-sm"
            style={{ color: "#9090a8" }}
          >
            Your account notifications and updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="w-fit px-4 py-2 text-sm font-semibold border"
            style={{
              borderColor: "rgba(212,160,23,0.25)",
              color: "#d4a017",
            }}
          >
            Mark all as read
          </button>
        )}

      </div>

      {/* LOADING */}
      {loading && (
        <div
          className="p-8 border text-center"
          style={{
            background: "#111118",
            borderColor: "rgba(212,160,23,0.15)",
            color: "#9090a8",
          }}
        >
          Loading notifications...
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div
          className="p-8 border"
          style={{
            background: "#111118",
            borderColor: "rgba(224,80,80,0.25)",
          }}
        >
          <p style={{ color: "#e05050" }}>
            {error}
          </p>

          <button
            onClick={loadNotifications}
            className="mt-4 px-5 py-2 font-semibold"
            style={{
              background: "#d4a017",
              color: "#09090e",
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* EMPTY */}
      {!loading &&
        !error &&
        notifications.length === 0 && (
          <div
            className="p-10 border text-center"
            style={{
              background: "#111118",
              borderColor: "rgba(212,160,23,0.15)",
            }}
          >
            <div
              className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
              style={{
                background: "rgba(212,160,23,0.1)",
                color: "#d4a017",
              }}
            >
              ♢
            </div>

            <p className="font-semibold">
              No notifications yet
            </p>

            <p
              className="text-sm mt-2"
              style={{ color: "#9090a8" }}
            >
              You will see account updates and investment
              notifications here.
            </p>
          </div>
        )}

      {/* NOTIFICATIONS */}
      {!loading &&
        !error &&
        notifications.length > 0 && (
          <div className="space-y-3">

            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-5 sm:p-6 border"
                style={{
                  background: notification.read
                    ? "#111118"
                    : "rgba(212,160,23,0.06)",
                  borderColor: notification.read
                    ? "rgba(212,160,23,0.15)"
                    : "rgba(212,160,23,0.3)",
                }}
              >

                <div className="flex items-start gap-4">

                  {/* INDICATOR */}
                  <div
                    className="w-10 h-10 shrink-0 flex items-center justify-center"
                    style={{
                      background: notification.read
                        ? "rgba(212,160,23,0.08)"
                        : "rgba(212,160,23,0.15)",
                      color: "#d4a017",
                    }}
                  >
                    ♢
                  </div>

                  {/* CONTENT */}
                  <div className="min-w-0 flex-1">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                      <div className="flex items-center gap-2">

                        <h2 className="font-bold">
                          {notification.title}
                        </h2>

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
                        className="text-xs shrink-0"
                        style={{ color: "#777789" }}
                      >
                        {formatDate(notification.created_at)}
                        {" · "}
                        {formatTime(notification.created_at)}
                      </p>

                    </div>

                    <p
                      className="text-sm mt-2 leading-6"
                      style={{ color: "#b0b0bd" }}
                    >
                      {notification.message}
                    </p>

                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="mt-4 text-xs font-semibold"
                        style={{ color: "#d4a017" }}
                      >
                        Mark as read
                      </button>
                    )}

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

    </div>
  );
}


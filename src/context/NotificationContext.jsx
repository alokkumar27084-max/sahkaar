// ─────────────────────────────────────────────────────────
// NotificationContext.jsx — Real-Time Push Notifications & Chimes
// ─────────────────────────────────────────────────────────
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { FiBell, FiMessageSquare, FiMapPin } from "react-icons/fi";
import { useAuth } from "./AuthContext";
import { notificationAPI } from "../services/api";
import { playNotificationSound } from "../utils/audioChime";

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  refreshNotifications: () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationAPI.getMine();
      const list = res.data?.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } catch (err) {
      // Non-blocking
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time WebSocket connection
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socketUrl = process.env.REACT_APP_API_URL?.replace("/api", "") || window.location.origin;
    const token = localStorage.getItem("sahkaar_token") || localStorage.getItem("sahkaari_token") || localStorage.getItem("token");

    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[NotificationSocket] Connected for user:", user.id);
      socket.emit("join_own_room");
    });

    // Receive real-time push notification
    const handleIncomingNotification = (data) => {
      console.log("[NotificationReceived]", data);
      
      // 1. Play pleasant audio chime
      playNotificationSound();

      // 2. Display interactive toast
      const isBooking = data.type?.includes("booking");
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-slate-900 text-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 border border-slate-700/80`}
          >
            <div className="flex-1 w-0">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  {isBooking ? <FiBell className="w-5 h-5" /> : <FiMessageSquare className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    {isBooking ? "New Master Booking Alert" : "SahKaar Update"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white leading-snug">
                    {data.message || data.notification?.message}
                  </p>
                  {data.data?.address && (
                    <p className="mt-1 text-xs text-slate-300 flex items-center gap-1.5">
                      <FiMapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{data.data.address}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex border-l border-slate-700 ml-3 pl-3 items-center">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-2 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        ),
        { duration: 8000 }
      );

      // 3. Dispatch window broadcast event for live dashboard auto-refresh
      window.dispatchEvent(
        new CustomEvent("sahkaar:booking_update", { detail: data })
      );
      window.dispatchEvent(
        new CustomEvent("sahkaari:booking_update", { detail: data })
      );

      // 4. Update internal list
      setNotifications((prev) => [
        {
          id: data.notification?.id || `notif_${Date.now()}`,
          message: data.message || data.notification?.message,
          type: data.type || "general",
          created_at: new Date().toISOString(),
          is_read: false,
        },
        ...prev,
      ]);
      setUnreadCount((c) => c + 1);
    };

    socket.on("notification:new", handleIncomingNotification);
    socket.on("booking:new", handleIncomingNotification);
    socket.on("notification", handleIncomingNotification);

    return () => {
      socket.off("notification:new", handleIncomingNotification);
      socket.off("booking:new", handleIncomingNotification);
      socket.off("notification", handleIncomingNotification);
      socket.disconnect();
    };
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      /* ignore */
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      /* ignore */
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

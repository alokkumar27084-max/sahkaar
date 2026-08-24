// ─────────────────────────────────────────────────────────
// NotificationContext.jsx — Real-Time Push Notifications & Chimes
// ─────────────────────────────────────────────────────────
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
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
    const token = localStorage.getItem("sahkaari_token") || localStorage.getItem("token");

    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Real-time notification socket connected for user:", user.id);
      socket.emit("join_own_room");
    });

    // Receive real-time push notification
    const handleIncomingNotification = (data) => {
      console.log("🔔 Real-time notification received:", data);
      
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
              <div className="flex items-start">
                <div className="shrink-0 pt-0.5 text-2xl">
                  {isBooking ? "🔔" : "💬"}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    {isBooking ? "New Master Booking Alert" : "SahKaari Update"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white leading-snug">
                    {data.message || data.notification?.message}
                  </p>
                  {data.data?.address && (
                    <p className="mt-1 text-xs text-slate-300">
                      📍 {data.data.address}
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

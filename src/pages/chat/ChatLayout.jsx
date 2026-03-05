import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { chatAPI } from "../../services/api";
import { io } from "socket.io-client";
import { FiSend, FiUser, FiInfo, FiArrowLeft } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

const SOCKET_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '')
    : "http://localhost:5000";

export default function ChatLayout() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [socket, setSocket] = useState(null);
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef(null);

    // Determine if we are on a mobile device and showing a message thread
    const [showThreadOnlyMobile, setShowThreadOnlyMobile] = useState(false);

    useEffect(() => {
        // 1. Initialize socket connection
        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            autoConnect: true
        });

        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id);
            if (user?.id) {
                newSocket.emit("join_own_room", user.id);
            }
        });

        newSocket.on("new_message", (msg) => {
            setMessages((prev) => {
                // Only append if it belongs to the currently active chat
                if (msg.chat_id === activeChatId) {
                    // Check if it already exists to prevent duplicates
                    if (!prev.some(m => m.id === msg.id)) {
                        return [...prev, msg];
                    }
                }
                return prev;
            });

            // Update the chat list summary (latest message, unread count)
            updateChatListSummary(msg.chat_id, msg.content, msg.sender_id !== user?.id);
        });

        return () => {
            console.log("Disconnecting socket...");
            newSocket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, activeChatId]);

    useEffect(() => {
        loadChats();
    }, []);

    // Handle initialization from Contractor verification/Contact button
    useEffect(() => {
        if (location.state && location.state.initChatWith) {
            initChat(location.state.initChatWith);
            // Clear state to avoid re-init
            navigate("/chat", { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state, navigate]);

    const loadChats = async () => {
        setLoadingChats(true);
        try {
            const res = await chatAPI.getChats();
            setChats(res.data.chats || []);
        } catch (err) {
            console.error("Failed to load chats:", err);
            toast.error("Failed to load conversations.");
        } finally {
            setLoadingChats(false);
        }
    };

    const initChat = async (contractorId) => {
        try {
            const res = await chatAPI.initChat(contractorId);
            if (res.data.chat) {
                await loadChats();
                handleSelectChat(res.data.chat.id);
            }
        } catch (err) {
            toast.error("Could not start conversation.");
        }
    };

    const loadMessages = async (chatId) => {
        setLoadingMessages(true);
        try {
            const res = await chatAPI.getMessages(chatId);
            setMessages(res.data.messages || []);

            // Clear unread count for this chat locally
            setChats(prev => prev.map(c =>
                c.id === chatId ? { ...c, unread_count: 0 } : c
            ));

        } catch (err) {
            console.error("Failed to load messages:", err);
            toast.error("Failed to load messages.");
        } finally {
            setLoadingMessages(false);
            scrollToBottom();
        }
    };

    const handleSelectChat = (chatId) => {
        if (activeChatId) {
            // leave old room? Optional, but good practice
        }
        setActiveChatId(chatId);
        setShowThreadOnlyMobile(true);
        loadMessages(chatId);

        // Join socket room for this chat thread
        if (socket) {
            socket.emit("join_chat", chatId);
        }
    };

    const updateChatListSummary = (chatId, content, isUnread) => {
        setChats(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(c => c.id === chatId);
            if (idx !== -1) {
                const chat = updated[idx];
                chat.last_message = content;
                chat.last_message_at = new Date().toISOString();
                if (isUnread && activeChatId !== chatId) {
                    chat.unread_count = Number(chat.unread_count || 0) + 1;
                }
                // Move to top
                updated.splice(idx, 1);
                updated.unshift(chat);
            }
            return updated;
        });
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !activeChatId) return;

        const content = inputMessage.trim();
        setInputMessage(""); // optimistic clear

        try {
            // The API sends it, and our socket receives it back.
            // But we can also optimistically add it if we want.
            // Let's rely on the API return to be safe.
            const res = await chatAPI.sendMessage(activeChatId, content);

            // Update local if we didn't receive it via socket yet
            setMessages(prev => {
                if (!prev.some(m => m.id === res.data.message.id)) {
                    return [...prev, res.data.message];
                }
                return prev;
            });
            updateChatListSummary(activeChatId, content, false);
            scrollToBottom();
        } catch (err) {
            toast.error("Message failed to send.");
            setInputMessage(content); // restore input
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    // Scroll on new message
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const activeChatData = chats.find(c => c.id === activeChatId);
    const isMobile = window.innerWidth < 768;

    const showList = !isMobile || !showThreadOnlyMobile;
    const showThread = !isMobile || showThreadOnlyMobile;

    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl h-[calc(100vh-80px)] xl:h-[calc(100vh-120px)] mt-4">
            <div className="flex h-full rounded-2xl overflow-hidden glass-card border border-white/20 shadow-xl bg-white/40 dark:bg-slate-900/40">

                {/* --- Chat List Sidebar --- */}
                {showList && (
                    <div className="w-full md:w-1/3 flex flex-col border-r border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md">
                        <div className="p-5 border-b border-slate-200 dark:border-white/10">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white font-['Space_Grotesk']">Messages</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loadingChats ? (
                                <div className="flex justify-center p-8"><LoadingSpinner size="md" /></div>
                            ) : chats.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                    <FiInfo className="mx-auto mb-2 opacity-50" size={24} />
                                    <p>No conversations yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                    {chats.map(chat => (
                                        <button
                                            key={chat.id}
                                            onClick={() => handleSelectChat(chat.id)}
                                            className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-start gap-4 ${activeChatId === chat.id ? 'bg-indigo-50/50 dark:bg-indigo-500/10' : ''}`}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                                <FiUser className="text-slate-400" size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h4 className="font-semibold text-slate-800 dark:text-white truncate pr-2">
                                                        {chat.other_party_name || "User"}
                                                    </h4>
                                                    {chat.last_message_at && (
                                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                            {new Date(chat.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                    {chat.last_message || "Started a conversation..."}
                                                </p>
                                            </div>
                                            {Number(chat.unread_count) > 0 && (
                                                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1 shadow-md">
                                                    {chat.unread_count}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Chat Thread View --- */}
                {showThread && (
                    <div className="w-full md:w-2/3 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 relative">
                        {activeChatId ? (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center gap-3 shadow-sm z-10">
                                    {isMobile && (
                                        <button onClick={() => setShowThreadOnlyMobile(false)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500">
                                            <FiArrowLeft size={20} />
                                        </button>
                                    )}
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                        <FiUser className="text-slate-400" size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white">{activeChatData?.other_party_name || "Conversation"}</h3>
                                        {/* Could add online status here in future */}
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {loadingMessages ? (
                                        <div className="flex justify-center p-8"><LoadingSpinner size="md" /></div>
                                    ) : messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                                <FiInfo size={24} />
                                            </div>
                                            <p>No messages yet. Say hello!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => {
                                            const isMe = msg.sender_id === user?.id;
                                            return (
                                                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                                                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-none'
                                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-bl-none border border-slate-100 dark:border-white/5'
                                                        }`}>
                                                        <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                                                        <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-t border-slate-200 dark:border-white/10 z-10">
                                    <form onSubmit={sendMessage} className="flex gap-2 relative max-w-4xl mx-auto">
                                        <input
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="flex-1 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-full px-5 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputMessage.trim()}
                                            className="w-12 h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center text-white shadow-lg disabled:opacity-50 flex-shrink-0"
                                        >
                                            <FiSend className="ml-0.5" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            // Empty State
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5 border border-slate-200 dark:border-white/5">
                                    <FiSend size={32} className="opacity-50 mr-1" />
                                </div>
                                <h3 className="text-xl font-medium text-slate-600 dark:text-slate-300 font-['Space_Grotesk'] mb-2">Your Messages</h3>
                                <p className="text-sm">Select a conversation from the list to start chatting.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

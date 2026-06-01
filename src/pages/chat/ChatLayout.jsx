import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { chatAPI, quoteAPI } from "../../services/api";
import { io } from "socket.io-client";
import { FiSend, FiUser, FiInfo, FiArrowLeft, FiPlus, FiCheck, FiX, FiFileText, FiCreditCard, FiImage, FiMapPin, FiCalendar, FiClock, FiShield, FiDownload, FiMessageCircle, FiStar } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getImageUrl } from "../../utils/imageUtils";
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
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteItems, setQuoteItems] = useState([{ title: "", amount: "" }]);
    const [quoteNotes, setQuoteNotes] = useState("");
    const [isSendingQuote, setIsSendingQuote] = useState(false);
    const [quotes, setQuotes] = useState({}); // Map of quoteId -> quoteData
    const [showProjectInfo, setShowProjectInfo] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [visitDate, setVisitDate] = useState("");
    const [visitTime, setVisitTime] = useState("");
    const messagesEndRef = useRef(null);
    const threadRef = useRef(null);
    const fileInputRef = useRef(null);

    // Determine if we are on a mobile device and showing a message thread
    const [showThreadOnlyMobile, setShowThreadOnlyMobile] = useState(false);

    const activeChatIdRef = useRef(activeChatId);

    useEffect(() => {
        activeChatIdRef.current = activeChatId;
    }, [activeChatId]);

    useEffect(() => {
        // 1. Initialize socket connection only once when user is available
        if (!user?.id) return;

        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            autoConnect: true,
            auth: {
                token: localStorage.getItem("thekedaar_token") || "",
            },
        });

        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id);
            newSocket.emit("join_own_room");
            if (activeChatIdRef.current) {
                newSocket.emit("join_chat", activeChatIdRef.current);
            }
        });

        newSocket.on("new_message", (msg) => {
            setMessages((prev) => {
                if (msg.chat_id === activeChatIdRef.current) {
                    if (!prev.some(m => m.id === msg.id)) {
                        return [...prev, msg];
                    }
                }
                return prev;
            });

            // If it's a quote message, we might want to fetch the quote data if not already present
            if (msg.message_type === 'quote' && msg.reference_id) {
                fetchQuote(msg.reference_id);
            }

            setChats(prevChats => {
                const updated = [...prevChats];
                const idx = updated.findIndex(c => c.id === msg.chat_id);
                if (idx !== -1) {
                    const chat = { ...updated[idx] };
                    chat.last_message = msg.content;
                    chat.last_message_at = new Date().toISOString();
                    if (msg.sender_id !== user?.id && activeChatIdRef.current !== msg.chat_id) {
                        chat.unread_count = Number(chat.unread_count || 0) + 1;
                    }
                    updated.splice(idx, 1);
                    updated.unshift(chat);
                }
                return updated;
            });
        });

        newSocket.on("quote_updated", (updatedQuote) => {
            setQuotes(prev => ({
                ...prev,
                [updatedQuote.id]: updatedQuote
            }));
        });

        return () => {
            console.log("Disconnecting socket...");
            newSocket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]); // Only recreate when user changes

    useEffect(() => {
        if (socket && activeChatId) {
            socket.emit("join_chat", activeChatId);
        }
    }, [socket, activeChatId]);

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
            const msgs = res.data.messages || [];
            setMessages(msgs);

            // Fetch any quotes referenced in these messages
            const quoteIds = msgs.filter(m => m.message_type === 'quote' && m.reference_id).map(m => m.reference_id);
            if (quoteIds.length > 0) {
                const qRes = await quoteAPI.getQuotesByChat(chatId);
                const qMap = {};
                qRes.data.quotes.forEach(q => qMap[q.id] = q);
                setQuotes(prev => ({ ...prev, ...qMap }));
            }

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

    const handleQuickAction = (action) => {
        switch (action) {
            case 'location':
                toast.success("Location shared with pro!");
                handleSendMessage(null, "📍 Shared Location: [Project Site]");
                break;
            case 'visit':
                setShowVisitModal(true);
                break;
            case 'plans':
            case 'image':
                fileInputRef.current?.click();
                break;
            case 'quote':
                if (user?.role === 'contractor') setShowQuoteModal(true);
                else {
                    toast.success("Quotation request sent!");
                    handleSendMessage(null, "📋 Request: Please provide an itemized quotation for this project.");
                }
                break;
            default:
                break;
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeChatId) return;

        const formData = new FormData();
        formData.append("media", file);

        const tid = toast.loading("Sending file...");
        try {
            await chatAPI.sendImage(activeChatId, formData);
            toast.success("File shared!", { id: tid });
            loadMessages(activeChatId);
        } catch (err) {
            toast.error("Failed to share file.", { id: tid });
        }
    };

    const handleBookVisit = async (e) => {
        e.preventDefault();
        if (!visitDate || !visitTime) return toast.error("Please select date and time.");

        toast.success("Visit request sent!");
        handleSendMessage(null, `📅 Site Visit Requested: ${visitDate} at ${visitTime}`);
        setShowVisitModal(false);
    };

    const fetchQuote = async (quoteId) => {
        if (quotes[quoteId]) return;
        try {
            const res = await quoteAPI.getQuotesByChat(activeChatId);
            const qMap = {};
            res.data.quotes.forEach(q => qMap[q.id] = q);
            setQuotes(prev => ({ ...prev, ...qMap }));
        } catch (err) {
            console.error("Failed to fetch quote:", err);
        }
    };

    const handleSelectChat = (chatId) => {
        setActiveChatId(chatId);
        setShowThreadOnlyMobile(true);
        loadMessages(chatId);
    };

    const handleSendMessage = async (e, forcedContent) => {
        if (e) e.preventDefault();
        const content = forcedContent || inputMessage.trim();
        if (!content || !activeChatId) return;

        if (!forcedContent) setInputMessage("");

        try {
            await chatAPI.sendMessage(activeChatId, content);
            scrollToBottom();
        } catch (err) {
            console.error("Failed to send message:", err);
            toast.error("Message could not be sent.");
            if (!forcedContent) setInputMessage(content);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    useEffect(() => {
        if (messages.length > 0 && threadRef.current) {
            const lastMsg = threadRef.current.querySelector(".message-bubble:last-child");
            if (lastMsg) {
                gsap.fromTo(lastMsg,
                    { opacity: 0, y: 10, scale: 0.95 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
                );
            }
        }
        scrollToBottom();
    }, [messages]);

    const handleSendQuote = async (e) => {
        e.preventDefault();
        const total = quoteItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
        if (total <= 0) return toast.error("Quote must have a total amount.");

        setIsSendingQuote(true);
        try {
            const res = await quoteAPI.createQuote({
                chatId: activeChatId,
                items: quoteItems.filter(i => i.title && i.amount),
                totalAmount: total,
                notes: quoteNotes
            });

            setMessages(prev => [...prev, res.data.message]);
            setQuotes(prev => ({ ...prev, [res.data.quote.id]: res.data.quote }));
            setShowQuoteModal(false);
            setQuoteItems([{ title: "", amount: "" }]);
            setQuoteNotes("");
            toast.success("Quote sent successfully!");
            scrollToBottom();
        } catch (err) {
            toast.error("Failed to send quote.");
        } finally {
            setIsSendingQuote(false);
        }
    };

    const handleUpdateQuoteStatus = async (quoteId, status) => {
        try {
            const res = await quoteAPI.updateQuoteStatus(quoteId, status);
            setQuotes(prev => ({ ...prev, [quoteId]: res.data.quote }));
            toast.success(`Quote ${status.toLowerCase()}!`);
        } catch (err) {
            toast.error("Failed to update quote.");
        }
    };

    const activeChatData = chats.find(c => c.id === activeChatId);
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth < 1280;

    const showList = !isMobile || !showThreadOnlyMobile;
    const showThread = !isMobile || showThreadOnlyMobile;
    const showProjectHub = showProjectInfo && activeChatId && !isTablet;

    return (
        <div className="min-h-screen bg-bg pt-24 pb-12 px-4 md:px-6 transition-colors duration-200">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf"
            />

            <div className="max-w-[1600px] mx-auto h-[calc(100vh-140px)] flex gap-4">

                {/* --- Left: Conversations List --- */}
                {showList && (
                    <div className={`w-full lg:w-80 xl:w-96 flex flex-col card overflow-hidden shrink-0 ${isMobile && showThreadOnlyMobile ? 'hidden' : 'flex'}`}>
                        <div className="p-5 border-b border-border flex items-center justify-between bg-bg-elevated">
                            <h2 className="text-lg font-bold text-heading">Inbox</h2>
                            <div className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                                {chats.length} active
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {loadingChats ? (
                                <div className="flex justify-center p-12"><LoadingSpinner size="md" /></div>
                            ) : chats.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center mx-auto mb-4 border border-border text-muted">
                                        <FiMessageCircle size={28} />
                                    </div>
                                    <p className="text-sm font-medium text-muted">No conversations yet</p>
                                </div>
                            ) : (
                                chats.map(chat => (
                                    <button
                                        key={chat.id}
                                        onClick={() => handleSelectChat(chat.id)}
                                        className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 flex items-start gap-4 border group ${activeChatId === chat.id
                                            ? 'bg-primary/5 border-primary/40'
                                            : 'hover:bg-bg-elevated border-transparent'}`}
                                    >
                                        <div className="w-11 h-11 rounded-lg bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:border-primary/50 transition-all">
                                            {chat.other_party_photo ? (
                                                <img src={getImageUrl(chat.other_party_photo)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <FiUser className="text-muted" size={20} />
                                            )}
                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-surface rounded-full" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className={`font-semibold text-sm truncate pr-2 ${activeChatId === chat.id ? 'text-primary' : 'text-heading'}`}>
                                                    {chat.other_party_name || "Pro Partner"}
                                                </h4>
                                                {chat.last_message_at && (
                                                    <span className="text-[10px] text-muted whitespace-nowrap">
                                                        {new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted truncate">
                                                {chat.last_message || "Start the project conversation"}
                                            </p>
                                        </div>
                                        {Number(chat.unread_count) > 0 && (
                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1">
                                                {chat.unread_count}
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* --- Center: Active Thread --- */}
                {showThread && (
                    <div className="flex-1 flex flex-col card overflow-hidden relative">
                        {activeChatId ? (
                            <>
                                {/* Thread Header */}
                                <div className="p-4 md:p-5 border-b border-border bg-bg-elevated flex items-center justify-between z-10">
                                    <div className="flex items-center gap-3">
                                        {isMobile && (
                                            <button onClick={() => setShowThreadOnlyMobile(false)} className="p-2 rounded-lg hover:bg-bg border border-border text-heading mr-1 transition-colors">
                                                <FiArrowLeft size={18} />
                                            </button>
                                        )}
                                        <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                            {activeChatData?.other_party_photo ? (
                                                <img src={getImageUrl(activeChatData.other_party_photo)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <FiUser className="text-muted" size={18} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-semibold text-base text-heading">{activeChatData?.other_party_name || "Pro Partner"}</h3>
                                                <div className="w-4 h-4 bg-primary/15 rounded-full flex items-center justify-center text-primary" title="Verified Pro">
                                                    <FiCheck size={10} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Online</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowProjectInfo(!showProjectInfo)}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${showProjectInfo ? 'bg-primary border-primary text-white' : 'bg-bg hover:bg-bg-elevated border-border text-muted hover:text-heading'}`}
                                            title="Toggle Project Hub"
                                        >
                                            <FiInfo size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div
                                    ref={threadRef}
                                    className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar scroll-smooth bg-bg/20"
                                >
                                    {loadingMessages ? (
                                        <div className="flex justify-center p-12"><LoadingSpinner size="md" /></div>
                                    ) : messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                                <FiMessageCircle size={32} />
                                            </div>
                                            <h3 className="text-lg font-bold text-heading mb-1">Secure Workspace</h3>
                                            <p className="text-xs text-muted max-w-xs leading-relaxed">Payments, plans, and conversations are encrypted and protected by Thekedaar Escrow.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {messages.map((msg, idx) => {
                                                const isMe = msg.sender_id === user?.id;
                                                const isQuote = msg.message_type === 'quote';
                                                const isSystem = msg.message_type === 'system';
                                                const isMedia = msg.message_type === 'image' || msg.message_type === 'file' || (msg.content && (msg.content.includes(".jpg") || msg.content.includes(".png")));
                                                const quote = isQuote ? quotes[msg.reference_id] : null;

                                                if (isSystem) {
                                                    return (
                                                        <div key={msg.id || idx} className="flex justify-center">
                                                            <div className="px-4 py-1.5 rounded-full bg-bg-elevated border border-border text-[11px] font-medium text-muted">
                                                                {msg.content}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                                        <div className={`max-w-[85%] md:max-w-[70%] message-bubble relative ${isMe ? 'items-end' : 'items-start'}`}>
                                                            <div className={`rounded-2xl px-4 py-3 border shadow-sm ${isMe
                                                                ? 'bg-primary border-primary text-white rounded-tr-none'
                                                                : 'bg-surface border-border text-heading rounded-tl-none'
                                                                }`}>

                                                                {isMedia ? (
                                                                    <div className="space-y-2">
                                                                        <div className="rounded-lg overflow-hidden border border-border bg-bg-elevated">
                                                                            <img src={getImageUrl(msg.content)} alt="Shared project asset" className="max-w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-300 cursor-zoom-in" />
                                                                        </div>
                                                                        <button className={`flex items-center gap-1.5 text-xs font-semibold hover:underline ${isMe ? 'text-white/80 hover:text-white' : 'text-primary'}`}>
                                                                            <FiDownload size={13} /> Download Asset
                                                                        </button>
                                                                    </div>
                                                                ) : isQuote && quote ? (
                                                                    <div className="space-y-4 min-w-[280px]">
                                                                        <div className="flex items-center gap-3 border-b border-border pb-3 mb-1">
                                                                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                                                                <FiFileText size={20} />
                                                                            </div>
                                                                            <div>
                                                                                <p className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'text-white/80' : 'text-primary'}`}>Project Proposal</p>
                                                                                <p className="text-xs font-medium text-muted">Items Quote</p>
                                                                            </div>
                                                                            <div className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                                quote.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                                                                quote.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 
                                                                                'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                                                }`}>
                                                                                {quote.status}
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            {quote.items.map((item, i) => (
                                                                                <div key={i} className="flex justify-between text-xs p-2.5 rounded-lg bg-bg-elevated/50 border border-border">
                                                                                    <span className="font-medium text-body">{item.title}</span>
                                                                                    <span className="font-bold text-heading">₹{Number(item.amount).toLocaleString()}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        <div className="flex justify-between items-center font-bold border-t border-border pt-4">
                                                                            <span className="text-xs text-muted">Total Estimate</span>
                                                                            <span className="text-lg text-heading">₹{Number(quote.total_amount).toLocaleString()}</span>
                                                                        </div>

                                                                        {!isMe && quote.status === 'PENDING' && (
                                                                            <div className="flex gap-2 pt-2">
                                                                                <button
                                                                                    onClick={() => handleUpdateQuoteStatus(quote.id, 'ACCEPTED')}
                                                                                    className="flex-1 bg-primary text-white font-bold py-2.5 rounded-lg text-xs hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow"
                                                                                >
                                                                                    <FiCheck size={14} /> Accept & Pay
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleUpdateQuoteStatus(quote.id, 'REJECTED')}
                                                                                    className="px-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 active:scale-[0.98] transition-all flex items-center justify-center shadow"
                                                                                >
                                                                                    <FiX size={15} />
                                                                                </button>
                                                                            </div>
                                                                        )}

                                                                        {!isMe && quote.status === 'ACCEPTED' && (
                                                                            <div className="pt-2">
                                                                                <button
                                                                                    onClick={() => navigate(`/checkout/${activeChatData.contractor_id}`, { state: { quoteId: quote.id } })}
                                                                                    className="w-full bg-primary text-white font-bold py-3 rounded-lg text-xs hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow"
                                                                                >
                                                                                    <FiCreditCard size={15} /> Checkout Securely
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm leading-relaxed break-words font-medium">{msg.content}</p>
                                                                )}
                                                            </div>
                                                            <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                                <span className="text-[10px] text-muted">
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {isMe && (
                                                                    <div className="flex items-center">
                                                                        <FiCheck className="text-primary/70" size={12} />
                                                                        <FiCheck className="text-primary/70 -ml-1.5" size={12} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Typing Indicator */}
                                {isTyping && (
                                    <div className="absolute bottom-24 left-6 flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border shadow-sm">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" />
                                        </div>
                                        <span className="text-[10px] font-medium text-muted">Partner typing...</span>
                                    </div>
                                )}

                                {/* Premium Quick Action Bar */}
                                <div className="px-5 py-3 bg-bg-elevated border-t border-border flex items-center gap-3 overflow-x-auto no-scrollbar">
                                    <button
                                        onClick={() => handleQuickAction('location')}
                                        className="whitespace-nowrap px-4 py-2 rounded-lg bg-surface border border-border text-xs font-semibold text-heading hover:bg-bg-elevated hover:border-primary/50 transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        <FiMapPin size={14} className="text-primary" /> Share Location
                                    </button>
                                    <button
                                        onClick={() => handleQuickAction('visit')}
                                        className="whitespace-nowrap px-4 py-2 rounded-lg bg-surface border border-border text-xs font-semibold text-heading hover:bg-bg-elevated hover:border-primary/50 transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        <FiCalendar size={14} className="text-primary" /> Book Visit
                                    </button>
                                    <button
                                        onClick={() => handleQuickAction('plans')}
                                        className="whitespace-nowrap px-4 py-2 rounded-lg bg-surface border border-border text-xs font-semibold text-heading hover:bg-bg-elevated hover:border-primary/50 transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        <FiImage size={14} className="text-primary" /> Attach Plans
                                    </button>
                                    <div className="w-px h-6 bg-border mx-1 shrink-0" />
                                    <button
                                        onClick={() => handleQuickAction('quote')}
                                        className="whitespace-nowrap px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                                    >
                                        Request Quote
                                    </button>
                                </div>

                                {/* Input Area */}
                                <form
                                    onSubmit={(e) => handleSendMessage(e)}
                                    className="p-4 bg-surface border-t border-border z-10"
                                >
                                    <div className="flex gap-3 max-w-5xl mx-auto items-center">
                                        <div className="flex-1 flex items-center bg-bg border border-border rounded-xl px-4 py-1.5 focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                            {user?.role === 'contractor' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowQuoteModal(true)}
                                                    className="w-9 h-9 rounded-lg bg-primary hover:bg-primary/95 text-white flex items-center justify-center shrink-0 transition-all active:scale-90 mr-3 shadow-sm"
                                                >
                                                    <FiPlus size={18} />
                                                </button>
                                            )}
                                            <input
                                                type="text"
                                                value={inputMessage}
                                                onChange={(e) => setInputMessage(e.target.value)}
                                                placeholder="Message your partner..."
                                                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-heading placeholder:text-muted py-3"
                                            />
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleQuickAction('image')} type="button" className="text-muted hover:text-heading transition-colors p-2">
                                                    <FiImage size={20} />
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!inputMessage.trim()}
                                            className="w-12 h-12 rounded-xl bg-primary hover:bg-primary/95 active:scale-95 transition-all flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-sm"
                                        >
                                            <FiSend size={20} className="ml-0.5" />
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            // Empty State
                            <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary relative">
                                    <FiMessageCircle size={36} />
                                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white animate-bounce shadow">
                                        <FiPlus size={14} />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-heading mb-2">Project Workspace</h3>
                                <p className="text-xs text-muted max-w-sm leading-relaxed">Initialize a connection to manage timelines, coordinate site visits, and handle secure payments.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- Right: Project Hub Sidebar --- */}
                {showProjectHub && (
                    <div className="w-80 flex flex-col gap-4 animate-in fade-in slide-in-from-right-8 duration-300">
                        {/* Summary Card */}
                        <div className="card p-6 flex flex-col">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-5 flex items-center gap-2">
                                <FiInfo size={15} /> Partner Insights
                            </h4>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-lg bg-bg-elevated border border-border flex items-center justify-center overflow-hidden shadow-sm">
                                        {activeChatData?.other_party_photo ? (
                                            <img src={getImageUrl(activeChatData.other_party_photo)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <FiUser className="text-muted" size={24} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-heading truncate">{activeChatData?.other_party_name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <FiShield className="text-emerald-500" size={12} />
                                            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Verified Contractor</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-bg-elevated border border-border text-center">
                                        <FiClock className="text-primary mx-auto mb-1.5" size={16} />
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-wider">Response</p>
                                        <p className="text-xs font-bold text-heading mt-0.5">Fast</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-bg-elevated border border-border text-center">
                                        <FiStar className="text-amber-500 mx-auto mb-1.5" size={16} />
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-wider">Rating</p>
                                        <p className="text-xs font-bold text-heading mt-0.5">4.9/5</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Milestone Tracker */}
                        <div className="flex-1 card p-6 overflow-y-auto custom-scrollbar">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
                                <FiCalendar size={15} /> Roadmap
                            </h4>

                            <div className="space-y-6 relative">
                                <div className="absolute left-[13px] top-2 bottom-2 w-[1.5px] bg-border" />

                                {[
                                    { label: "Phase 1: Discussion", status: "completed", icon: <FiMessageCircle size={10} /> },
                                    { label: "Phase 2: Quotation", status: "current", icon: <FiFileText size={10} /> },
                                    { label: "Phase 3: Formal Contract", status: "pending", icon: <FiCheck size={10} /> },
                                    { label: "Phase 4: Escrow Setup", status: "pending", icon: <FiCreditCard size={10} /> },
                                    { label: "Phase 5: Execution", status: "pending", icon: <FiPlus size={10} /> },
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4 items-center relative z-10">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                                            step.status === 'completed' ? 'bg-emerald-500 text-white' :
                                            step.status === 'current' ? 'bg-primary text-white ring-4 ring-primary/10' : 'bg-bg-elevated border border-border text-muted'
                                            }`}>
                                            {step.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-xs font-semibold truncate ${step.status === 'pending' ? 'text-muted' : 'text-heading'}`}>
                                                {step.label}
                                            </p>
                                            {step.status === 'current' && <p className="text-[10px] font-bold text-primary uppercase tracking-wider mt-0.5 animate-pulse">In Review</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Book Visit Modal */}
            {showVisitModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-border flex justify-between items-center bg-bg-elevated">
                            <div>
                                <h3 className="text-lg font-bold text-heading">Schedule Visit</h3>
                                <p className="text-xs text-muted mt-0.5">Coordinate on-site inspection</p>
                            </div>
                            <button onClick={() => setShowVisitModal(false)} className="w-8 h-8 rounded-lg hover:bg-bg border border-border text-heading flex items-center justify-center transition-all">
                                <FiX size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleBookVisit} className="p-6 space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Preferred Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={visitDate}
                                        onChange={(e) => setVisitDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Time Slot</label>
                                    <input
                                        type="time"
                                        className="input-field"
                                        value={visitTime}
                                        onChange={(e) => setVisitTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary w-full py-3 rounded-lg font-bold shadow-lg shadow-primary/10 mt-4"
                            >
                                Send Request to Pro
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Quote Modal */}
            {showQuoteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-border">
                        <div className="p-5 border-b border-border flex justify-between items-center bg-bg-elevated">
                            <h3 className="text-lg font-bold text-heading">Create Itemized Quote</h3>
                            <button onClick={() => setShowQuoteModal(false)} className="text-muted hover:text-heading"><FiX size={20} /></button>
                        </div>
                        <form onSubmit={handleSendQuote} className="p-5 space-y-4">
                            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                                {quoteItems.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            className="flex-1 input-field !py-2 !text-sm"
                                            placeholder="Item title (e.g. Wiring material)"
                                            value={item.title}
                                            onChange={(e) => {
                                                const newItems = [...quoteItems];
                                                newItems[index].title = e.target.value;
                                                setQuoteItems(newItems);
                                            }}
                                            required
                                        />
                                        <input
                                            className="w-24 input-field !py-2 !text-sm"
                                            type="number"
                                            placeholder="Amount"
                                            value={item.amount}
                                            onChange={(e) => {
                                                const newItems = [...quoteItems];
                                                newItems[index].amount = e.target.value;
                                                setQuoteItems(newItems);
                                            }}
                                            required
                                        />
                                        {quoteItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== index))}
                                                className="text-rose-500 hover:text-rose-600 p-2"
                                            >
                                                <FiX size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => setQuoteItems([...quoteItems, { title: "", amount: "" }])}
                                className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                            >
                                <FiPlus size={14} /> Add another item
                            </button>

                            <div className="pt-2 border-t border-border">
                                <label className="block text-sm font-bold text-heading mb-1">Total Amount: ₹{quoteItems.reduce((acc, i) => acc + (Number(i.amount) || 0), 0).toLocaleString()}</label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Notes (Optional)</label>
                                <textarea
                                    className="input-field min-h-[80px] !text-sm"
                                    placeholder="Any additional terms or details..."
                                    value={quoteNotes}
                                    onChange={(e) => setQuoteNotes(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSendingQuote}
                                className="btn-primary w-full py-3 rounded-lg font-bold shadow-lg shadow-primary/10 mt-2"
                            >
                                {isSendingQuote ? <LoadingSpinner size="sm" /> : "Send Quote to Customer"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

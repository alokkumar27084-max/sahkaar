import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { chatAPI, quoteAPI } from "../../services/api";
import { io } from "socket.io-client";
import { FiSend, FiUser, FiInfo, FiArrowLeft, FiPlus, FiCheck, FiX, FiFileText, FiCreditCard, FiImage, FiMapPin, FiCalendar, FiClock, FiShield, FiMoreVertical, FiDownload, FiMessageCircle, FiStar } from "react-icons/fi";
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
        switch(action) {
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
            // We can just get all quotes for the chat to be simple, or add a getQuoteById API
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

    const updateChatListSummary = (chatId, content, isUnread) => {
        setChats(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(c => c.id === chatId);
            if (idx !== -1) {
                const chat = { ...updated[idx] };
                chat.last_message = content;
                chat.last_message_at = new Date().toISOString();
                if (isUnread && activeChatIdRef.current !== chatId) {
                    chat.unread_count = Number(chat.unread_count || 0) + 1;
                }
                // Move to top
                updated.splice(idx, 1);
                updated.unshift(chat);
            }
            return updated;
        });
    };

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
        <div className="min-h-screen bg-[#090B19] pt-24 pb-12 px-4 md:px-6">
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
                    <div className={`w-full lg:w-80 xl:w-96 flex flex-col glass-card border-white/10 bg-[#0D1126] overflow-hidden shrink-0 ${isMobile && showThreadOnlyMobile ? 'hidden' : 'flex'}`}>
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <h2 className="text-xl font-black uppercase tracking-tighter text-white">Inbox</h2>
                            <div className="px-2 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                {chats.length} active
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loadingChats ? (
                                <div className="flex justify-center p-12"><LoadingSpinner size="md" /></div>
                            ) : chats.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10 text-slate-500">
                                        <FiMessageCircle size={28} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No conversations yet</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {chats.map(chat => (
                                        <button
                                            key={chat.id}
                                            onClick={() => handleSelectChat(chat.id)}
                                            className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-start gap-4 group ${activeChatId === chat.id 
                                                ? 'bg-indigo-500/20 border border-indigo-500/30 shadow-lg shadow-black/20' 
                                                : 'hover:bg-white/5 border border-transparent'}`}
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:border-indigo-500/50 transition-all">
                                                {chat.other_party_photo ? (
                                                    <img src={getImageUrl(chat.other_party_photo)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <FiUser className="text-slate-400" size={20} />
                                                )}
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0D1126] rounded-full shadow-sm" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h4 className={`font-bold text-sm truncate pr-2 transition-colors ${activeChatId === chat.id ? 'text-indigo-300' : 'text-white'}`}>
                                                        {chat.other_party_name || "Pro Partner"}
                                                    </h4>
                                                    {chat.last_message_at && (
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase whitespace-nowrap">
                                                            {new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-400 truncate font-bold uppercase tracking-wider opacity-60">
                                                    {chat.last_message || "Start the project conversation"}
                                                </p>
                                            </div>
                                            {Number(chat.unread_count) > 0 && (
                                                <div className="w-5 h-5 rounded-lg bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white shrink-0 mt-1 shadow-lg shadow-indigo-500/40">
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

                {/* --- Center: Active Thread --- */}
                {showThread && (
                    <div className="flex-1 flex flex-col glass-card border-white/10 bg-[#0D1126] overflow-hidden relative shadow-2xl">
                        {activeChatId ? (
                            <>
                                {/* Thread Header */}
                                <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.03] backdrop-blur-3xl flex items-center justify-between z-10">
                                    <div className="flex items-center gap-4">
                                        {isMobile && (
                                            <button onClick={() => setShowThreadOnlyMobile(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white mr-2 transition-colors shadow-lg">
                                                <FiArrowLeft size={20} />
                                            </button>
                                        )}
                                        <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 relative overflow-hidden shadow-lg">
                                            {activeChatData?.other_party_photo ? (
                                                <img src={getImageUrl(activeChatData.other_party_photo)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <FiUser className="text-slate-400" size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-lg text-white tracking-tight">{activeChatData?.other_party_name || "Pro Partner"}</h3>
                                                <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-white" title="Verified Pro">
                                                    <FiCheck size={10} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Active Now</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setShowProjectInfo(!showProjectInfo)}
                                            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-lg ${showProjectInfo ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'}`}
                                            title="Toggle Project Hub"
                                        >
                                            <FiInfo size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div 
                                    ref={threadRef}
                                    className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth bg-white/[0.01]"
                                >
                                    {loadingMessages ? (
                                        <div className="flex justify-center p-12"><LoadingSpinner size="md" /></div>
                                    ) : messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center">
                                            <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-6 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                                                <FiMessageCircle size={48} className="opacity-40" />
                                            </div>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Secure Workspace</h3>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest max-w-xs leading-relaxed">Payments, plans, and conversations are encrypted and protected by Thekedaar Escrow.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {messages.map((msg, idx) => {
                                                const isMe = msg.sender_id === user?.id;
                                                const isQuote = msg.message_type === 'quote';
                                                const isSystem = msg.message_type === 'system';
                                                const isMedia = msg.message_type === 'image' || msg.message_type === 'file' || (msg.content && (msg.content.includes(".jpg") || msg.content.includes(".png")));
                                                const quote = isQuote ? quotes[msg.reference_id] : null;

                                                if (isSystem) {
                                                    return (
                                                        <div key={msg.id || idx} className="flex justify-center">
                                                            <div className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] shadow-sm">
                                                                {msg.content}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                                        <div className={`max-w-[85%] md:max-w-[70%] message-bubble relative ${isMe ? 'items-end' : 'items-start'}`}>
                                                            <div className={`rounded-2xl px-5 py-4 shadow-2xl transition-all duration-300 ${isMe
                                                                ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none border border-white/20'
                                                                : 'bg-[#1C213B] text-white rounded-tl-none border border-white/10 shadow-black/40'
                                                                }`}>
                                                                
                                                                {isMedia ? (
                                                                    <div className="space-y-3">
                                                                        <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                                                            <img src={getImageUrl(msg.content)} alt="Shared project asset" className="max-w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in" />
                                                                        </div>
                                                                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:text-white transition-colors">
                                                                            <FiDownload size={14} /> Download Asset
                                                                        </button>
                                                                    </div>
                                                                ) : isQuote && quote ? (
                                                                    <div className="space-y-5 min-w-[300px]">
                                                                        <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-2">
                                                                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-inner">
                                                                                <FiFileText size={24} />
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-200">Project Proposal</p>
                                                                                <p className="text-sm font-black text-white tracking-tight">Rev: 0.12</p>
                                                                            </div>
                                                                            <div className={`ml-auto text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg ${
                                                                                quote.status === 'ACCEPTED' ? 'bg-emerald-500 text-white' :
                                                                                quote.status === 'REJECTED' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'
                                                                            }`}>
                                                                                {quote.status}
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="space-y-3">
                                                                            {quote.items.map((item, i) => (
                                                                                <div key={i} className="flex justify-between text-xs p-3 rounded-xl bg-black/20 border border-white/5">
                                                                                    <span className="font-bold text-slate-300">{item.title}</span>
                                                                                    <span className="font-black text-white">₹{Number(item.amount).toLocaleString()}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        
                                                                        <div className="flex justify-between items-center font-black border-t border-white/20 pt-5 text-xl tracking-tighter">
                                                                            <span className="text-[11px] uppercase tracking-[0.2em] text-indigo-300">Final Estimate</span>
                                                                            <span className="text-2xl">₹{Number(quote.total_amount).toLocaleString()}</span>
                                                                        </div>

                                                                        {!isMe && quote.status === 'PENDING' && (
                                                                            <div className="flex gap-3 pt-3">
                                                                                <button 
                                                                                    onClick={() => handleUpdateQuoteStatus(quote.id, 'ACCEPTED')}
                                                                                    className="flex-1 bg-white text-indigo-700 font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-2xl"
                                                                                >
                                                                                    <FiCheck size={16} /> Accept & Pay
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => handleUpdateQuoteStatus(quote.id, 'REJECTED')}
                                                                                    className="px-5 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center shadow-lg"
                                                                                >
                                                                                    <FiX size={18} />
                                                                                </button>
                                                                            </div>
                                                                        )}

                                                                        {!isMe && quote.status === 'ACCEPTED' && (
                                                                            <div className="pt-3">
                                                                                <button 
                                                                                    onClick={() => navigate(`/checkout/${activeChatData.contractor_id}`, { state: { quoteId: quote.id } })}
                                                                                    className="w-full bg-indigo-400 text-white font-black py-5 rounded-2xl text-[12px] uppercase tracking-[0.25em] hover:bg-indigo-300 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-[0_10px_40px_rgba(129,140,248,0.3)]"
                                                                                >
                                                                                    <FiCreditCard size={20} /> Checkout Securely
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[15px] font-bold leading-relaxed break-words tracking-tight">{msg.content}</p>
                                                                )}
                                                            </div>
                                                            <div className={`flex items-center gap-3 mt-2 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {isMe && (
                                                                    <div className="flex items-center">
                                                                        <FiCheck className="text-indigo-500" size={12} />
                                                                        <FiCheck className="text-indigo-500 -ml-1.5" size={12} />
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
                                    <div className="absolute bottom-28 left-10 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3">
                                        <div className="flex gap-1.5">
                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                                        </div>
                                        <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Pro is reviewing...</span>
                                    </div>
                                )}

                                {/* Premium Quick Action Bar */}
                                <div className="px-6 py-5 bg-[#0D1126] border-t border-white/10 flex items-center gap-4 overflow-x-auto no-scrollbar">
                                    <button 
                                        onClick={() => handleQuickAction('location')}
                                        className="whitespace-nowrap px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.15em] hover:bg-white/10 hover:border-indigo-500/50 transition-all flex items-center gap-3 shadow-lg active:scale-95"
                                    >
                                        <FiMapPin size={16} className="text-indigo-400" /> Share Location
                                    </button>
                                    <button 
                                        onClick={() => handleQuickAction('visit')}
                                        className="whitespace-nowrap px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.15em] hover:bg-white/10 hover:border-indigo-500/50 transition-all flex items-center gap-3 shadow-lg active:scale-95"
                                    >
                                        <FiCalendar size={16} className="text-indigo-400" /> Book Visit
                                    </button>
                                    <button 
                                        onClick={() => handleQuickAction('plans')}
                                        className="whitespace-nowrap px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.15em] hover:bg-white/10 hover:border-indigo-500/50 transition-all flex items-center gap-3 shadow-lg active:scale-95"
                                    >
                                        <FiImage size={16} className="text-indigo-400" /> Attach Plans
                                    </button>
                                    <div className="w-px h-8 bg-white/10 mx-2 shrink-0" />
                                    <button 
                                        onClick={() => handleQuickAction('quote')}
                                        className="whitespace-nowrap px-6 py-3 rounded-2xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-400 transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(99,102,241,0.2)] active:scale-95"
                                    >
                                        Request Quote
                                    </button>
                                </div>

                                {/* Input Area */}
                                <form 
                                    onSubmit={(e) => handleSendMessage(e)}
                                    className="p-8 bg-[#0B0E21] border-t border-white/20 z-10"
                                >
                                    <div className="flex gap-5 max-w-5xl mx-auto items-center">
                                        <div className="flex-1 flex items-center bg-white/5 border border-white/20 rounded-3xl px-6 py-2 group focus-within:border-indigo-500/80 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:bg-white/10 transition-all shadow-inner">
                                            {user?.role === 'contractor' && (
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowQuoteModal(true)}
                                                    className="w-12 h-12 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center shrink-0 transition-all active:scale-90 mr-4 shadow-xl"
                                                >
                                                    <FiPlus size={24} />
                                                </button>
                                            )}
                                            <input
                                                type="text"
                                                value={inputMessage}
                                                onChange={(e) => setInputMessage(e.target.value)}
                                                placeholder="Message your partner..."
                                                className="flex-1 bg-transparent border-none outline-none text-base font-bold text-white placeholder:text-slate-600 py-4"
                                            />
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => handleQuickAction('image')} type="button" className="text-slate-400 hover:text-white transition-colors p-2">
                                                    <FiImage size={24} />
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!inputMessage.trim()}
                                            className="w-16 h-16 rounded-[2rem] bg-indigo-500 hover:bg-indigo-400 active:scale-95 transition-all flex items-center justify-center text-white shadow-[0_15px_40px_rgba(99,102,241,0.3)] disabled:opacity-10 shrink-0"
                                        >
                                            <FiSend size={28} className="ml-1" />
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            // Empty State
                            <div className="h-full flex flex-col items-center justify-center text-center p-16">
                                <div className="w-32 h-32 rounded-[3.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-10 text-indigo-400 relative shadow-[0_0_60px_rgba(99,102,241,0.15)]">
                                    <FiMessageCircle size={64} className="opacity-30" />
                                    <div className="absolute -top-3 -right-3 w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white animate-bounce shadow-2xl">
                                        <FiPlus size={24} />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Project Workspace</h3>
                                <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] max-w-sm leading-relaxed opacity-60">Initialize a connection to manage timelines, coordinate site visits, and handle secure payments.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- Right: Project Hub Sidebar --- */}
                {showProjectHub && (
                    <div className="w-96 flex flex-col gap-6 animate-in fade-in slide-in-from-right-8 duration-700">
                        {/* Summary Card */}
                        <div className="glass-card border-white/10 bg-[#0D1126] p-8 shadow-2xl">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-8 flex items-center gap-3">
                                <FiInfo size={16} /> Partner Insights
                            </h4>
                            
                            <div className="space-y-8">
                                <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/20 flex items-center justify-center overflow-hidden shadow-2xl">
                                        {activeChatData?.other_party_photo ? (
                                            <img src={getImageUrl(activeChatData.other_party_photo)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <FiUser className="text-slate-500" size={36} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-white tracking-tighter">{activeChatData?.other_party_name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <FiShield className="text-emerald-400" size={14} />
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verified Contractor</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center shadow-inner">
                                        <FiClock className="text-indigo-400 mx-auto mb-2" size={18} />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response</p>
                                        <p className="text-[12px] font-black text-white mt-1">FAST</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center shadow-inner">
                                        <FiStar className="text-amber-400 mx-auto mb-2" size={18} />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trust</p>
                                        <p className="text-[12px] font-black text-white mt-1">4.9/5</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Milestone Tracker */}
                        <div className="flex-1 glass-card border-white/10 bg-[#0D1126] p-8 overflow-y-auto custom-scrollbar shadow-2xl">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-10 flex items-center gap-3">
                                <FiCalendar size={16} /> Roadmap
                            </h4>

                            <div className="space-y-10 relative">
                                <div className="absolute left-[13px] top-2 bottom-2 w-[2px] bg-white/10" />
                                
                                {[
                                    { label: "Phase 1: Discussion", status: "completed", icon: <FiMessageCircle size={12} /> },
                                    { label: "Phase 2: Quotation", status: "current", icon: <FiFileText size={12} /> },
                                    { label: "Phase 3: Formal Contract", status: "pending", icon: <FiCheck size={12} /> },
                                    { label: "Phase 4: Escrow Setup", status: "pending", icon: <FiCreditCard size={12} /> },
                                    { label: "Phase 5: Execution", status: "pending", icon: <FiPlus size={12} /> },
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-6 items-center relative z-10">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xl transition-all duration-500 ${
                                            step.status === 'completed' ? 'bg-emerald-500 text-white' :
                                            step.status === 'current' ? 'bg-indigo-500 text-white scale-125 ring-4 ring-indigo-500/20' : 'bg-white/10 text-slate-600'
                                        }`}>
                                            {step.icon}
                                        </div>
                                        <div>
                                            <p className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${step.status === 'pending' ? 'text-slate-600' : 'text-white'}`}>
                                                {step.label}
                                            </p>
                                            {step.status === 'current' && <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1.5 animate-pulse">In Review</p>}
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
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <div className="bg-[#0D1126] border border-white/20 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                            <div>
                                <h3 className="text-2xl font-black font-['Space_Grotesk'] text-white tracking-tighter">Schedule Visit</h3>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Coordinate on-site inspection</p>
                            </div>
                            <button onClick={() => setShowVisitModal(false)} className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-rose-500 text-white flex items-center justify-center transition-all">
                                <FiX size={20}/>
                            </button>
                        </div>
                        <form onSubmit={handleBookVisit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Preferred Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:border-indigo-500 transition-all outline-none"
                                        value={visitDate}
                                        onChange={(e) => setVisitDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Time Slot</label>
                                    <input 
                                        type="time" 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:border-indigo-500 transition-all outline-none"
                                        value={visitTime}
                                        onChange={(e) => setVisitTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-5 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.25em] shadow-2xl shadow-indigo-500/20 active:scale-95 transition-all mt-4"
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
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-white/10">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-black font-['Space_Grotesk'] text-slate-800 dark:text-white">Create Itemized Quote</h3>
                            <button onClick={() => setShowQuoteModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><FiX size={24}/></button>
                        </div>
                        <form onSubmit={handleSendQuote} className="p-6 space-y-4">
                            <div className="space-y-3">
                                {quoteItems.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input 
                                            className="flex-1 input-field !py-2.5 !text-sm" 
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
                                            className="w-28 input-field !py-2.5 !text-sm" 
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
                                                className="text-rose-500 p-2"
                                            >
                                                <FiX />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setQuoteItems([...quoteItems, { title: "", amount: "" }])}
                                className="text-indigo-500 text-sm font-bold flex items-center gap-1 hover:underline"
                            >
                                <FiPlus /> Add another item
                            </button>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Total Amount: ₹{quoteItems.reduce((acc, i) => acc + (Number(i.amount) || 0), 0)}</label>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
                                <textarea 
                                    className="input-field !py-2.5 !text-sm min-h-[80px]" 
                                    placeholder="Any additional terms or details..." 
                                    value={quoteNotes}
                                    onChange={(e) => setQuoteNotes(e.target.value)}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSendingQuote}
                                className="btn-primary w-full py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20"
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

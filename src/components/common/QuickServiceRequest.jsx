import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMessageSquare, FiX, FiSend } from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import toast from "react-hot-toast";

export default function QuickServiceRequest() {
    const { lang } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", phone: "", service: "" });

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setIsOpen(false);
            setFormData({ name: "", phone: "", service: "" });
            toast.success(lang === "hi" ? "Request mil gayi!" : "Request received!");
        }, 1200);
    };

    return (
        <>
            {/* Floating Action Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white flex items-center justify-center shadow-btn animate-pulse-glow"
                        aria-label="Quick Service Request"
                    >
                        <FiMessageSquare size={22} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-50 bg-navy-dark/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 60, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.96 }}
                            transition={{ type: "spring", damping: 25, stiffness: 250 }}
                            className="fixed bottom-6 right-6 z-50 w-[calc(100%-48px)] max-w-[380px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-glass-lg"
                        >
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-display text-lg font-bold text-[var(--color-heading)]">
                                    {lang === "hi" ? "Quick Service" : "Quick Service"}
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-border)] transition-colors"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                <input
                                    type="text"
                                    required
                                    placeholder={lang === "hi" ? "Aapka Naam" : "Your Name"}
                                    className="input-field !h-11 text-sm"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                <input
                                    type="tel"
                                    required
                                    placeholder={lang === "hi" ? "Phone Number" : "Phone Number"}
                                    className="input-field !h-11 text-sm"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                                <textarea
                                    required
                                    placeholder={lang === "hi" ? "Service describe karein" : "Describe the service you need"}
                                    className="input-field !min-h-[80px] text-sm"
                                    value={formData.service}
                                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-primary !h-11 btn-shimmer"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <FiSend size={15} />
                                            {lang === "hi" ? "Bhejein" : "Send Request"}
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

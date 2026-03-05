import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { authAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return toast.error("Please enter your email");

        setLoading(true);
        try {
            await authAPI.forgotPassword(email);
            setSuccess(true);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to process request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[var(--color-bg)]">
            <div className="w-full max-w-md glass-card p-8 text-center">
                {!success ? (
                    <>
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiMail className="w-8 h-8 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold font-display text-[var(--color-heading)] mb-2">Forgot Password?</h2>
                        <p className="text-[var(--color-muted)] text-sm mb-8">
                            No worries, we'll send you reset instructions.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="text-left">
                                <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">Email address</label>
                                <div className="relative">
                                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="input-field !pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Reset Password"}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiCheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold font-display text-[var(--color-heading)] mb-2">Check your email</h2>
                        <p className="text-[var(--color-muted)] text-sm mb-8">
                            We sent a password reset link to <br /><strong>{email}</strong>
                        </p>
                    </>
                )}

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-sm text-[var(--color-primary)] font-medium hover:underline flex items-center justify-center gap-1">
                        <FiArrowRight className="w-4 h-4 rotate-180" /> Back to log in
                    </Link>
                </div>
            </div>
        </div>
    );
}

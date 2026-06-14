import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiCheckCircle, FiChevronLeft } from "react-icons/fi";
import { auth } from "../../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import toast from "react-hot-toast";
import { ThekedaarLogo } from "../../components/common/ThekedaarLogo";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      toast.error(err.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-elevated)] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      
      {/* Decorative highlights */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[460px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-8 relative z-10"
      >
        {!success ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2 mb-4">
                <ThekedaarLogo className="h-9 w-9" />
              </Link>
              <h1 className="text-2xl font-bold text-[var(--color-heading)] tracking-tight">
                Forgot Password?
              </h1>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                Enter your email address and we'll send you reset instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-body)] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-heading)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl text-sm font-bold flex items-center justify-center shadow-sm transition-all"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-heading)] tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-2 leading-relaxed">
              We sent a password reset link to: <br />
              <strong className="text-[var(--color-heading)] font-semibold">{email}</strong>
            </p>
          </div>
        )}

        <div className="mt-8 pt-5 border-t border-[var(--color-border)] text-center">
          <Link
            to="/login"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-heading)] font-bold flex items-center justify-center gap-1 transition-colors"
          >
            <FiChevronLeft size={16} />
            <span>Back to login</span>
          </Link>
        </div>

      </motion.div>
    </div>
  );
}

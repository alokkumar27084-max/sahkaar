import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiLock, FiCheckCircle } from "react-icons/fi";
import { authAPI } from "../../services/api";
import { isValidPassword } from "../../utils/validators";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token || !email) {
            toast.error("Invalid password reset link");
            navigate("/login");
        }
    }, [token, email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValidPassword(password)) {
            return toast.error("Password must be at least 8 characters long");
        }

        setLoading(true);
        try {
            await authAPI.resetPassword(email, token, password);
            setSuccess(true);
            toast.success("Password successfully reset!");
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset password. The link might be expired.");
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
                            <FiLock className="w-8 h-8 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold font-display text-[var(--color-heading)] mb-2">Set new password</h2>
                        <p className="text-[var(--color-muted)] text-sm mb-8">
                            Your new password must be different to previously used passwords.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4 text-left">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">New Password</label>
                                <div className="relative">
                                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="input-field !pl-10"
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <p className="text-xs text-[var(--color-muted)] mt-2">Must be at least 8 characters.</p>
                            </div>

                            <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Reset password"}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiCheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold font-display text-[var(--color-heading)] mb-2">Password reset</h2>
                        <p className="text-[var(--color-muted)] text-sm mb-8">
                            Your password has been successfully reset. Click below to log in magically.
                        </p>
                        <Link to="/login" className="btn-primary w-full flex justify-center py-3">
                            Continue to Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

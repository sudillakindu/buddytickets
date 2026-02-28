"use client";

import { useState, useCallback } from "react";
import { Mail, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { sendTestEmail, type EmailType } from "@/lib/actions/test-email";
import { Toast } from "@/components/ui/toast";

interface EmailOption {
    type: EmailType;
    label: string;
    description: string;
}

const EMAIL_OPTIONS: EmailOption[] = [
    {
        type: "signup-otp",
        label: "Sign-Up OTP",
        description: "Verification code sent after registration",
    },
    {
        type: "signin-otp",
        label: "Sign-In OTP",
        description: "Verification code sent during sign-in",
    },
    {
        type: "forgot-password-otp",
        label: "Forgot Password OTP",
        description: "Verification code for password reset",
    },
    {
        type: "welcome",
        label: "Welcome Email",
        description: "Sent after account creation",
    },
    {
        type: "password-changed",
        label: "Password Changed",
        description: "Notification after password update",
    },
];

interface LogEntry {
    id: number;
    type: EmailType;
    to: string;
    success: boolean;
    message: string;
    time: string;
}

export default function TestEmailPage() {
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState<EmailType | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const handleSend = useCallback(
        async (type: EmailType) => {
            if (!email.trim()) {
                Toast("Error", "Please enter an email address.", "error");
                return;
            }

            setSending(type);
            try {
                const result = await sendTestEmail(type, email.trim());

                const entry: LogEntry = {
                    id: Date.now(),
                    type,
                    to: email.trim(),
                    success: result.success,
                    message: result.message,
                    time: new Date().toLocaleTimeString(),
                };
                setLogs((prev) => [entry, ...prev]);

                if (result.success) {
                    Toast("Sent", result.message, "success");
                } else {
                    Toast("Failed", result.message, "error");
                }
            } catch {
                Toast("Error", "An unexpected error occurred.", "error");
            } finally {
                setSending(null);
            }
        },
        [email]
    );

    return (
        <section className="min-h-[100dvh] w-full bg-[hsl(210,40%,98%)] py-12 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="font-primary text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                        Email Template Tester
                    </h1>
                    <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
                        Send test emails to preview all templates in your inbox.
                    </p>
                </div>

                {/* Email Input */}
                <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_hsl(222.2_47.4%_11.2%_/_0.08),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.04)]">
                    <label className="font-secondary text-sm font-medium text-[hsl(222.2,47.4%,11.2%)] block mb-2">
                        Recipient Email
                    </label>
                    <div className="relative">
                        <Mail
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215.4,16.3%,46.9%)]"
                            aria-hidden="true"
                        />
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="font-secondary w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-[hsl(210,40%,98%)] border-2 border-[hsl(214.3,31.8%,91.4%)] text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus:outline-none focus:border-[hsl(270,70%,50%)] transition-colors"
                        />
                    </div>
                </div>

                {/* Email Buttons */}
                <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_hsl(222.2_47.4%_11.2%_/_0.08),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.04)]">
                    <h2 className="font-primary text-base font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-4">
                        Email Templates
                    </h2>
                    <div className="space-y-3">
                        {EMAIL_OPTIONS.map((opt) => (
                            <button
                                key={opt.type}
                                onClick={() => handleSend(opt.type)}
                                disabled={sending !== null}
                                className="w-full flex items-center justify-between gap-4 px-5 py-4 rounded-xl border-2 border-[hsl(214.3,31.8%,91.4%)] bg-[hsl(210,40%,98%)] hover:border-[hsl(270,70%,50%)] hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                            >
                                <div className="text-left">
                                    <p className="font-primary text-sm font-medium text-[hsl(222.2,47.4%,11.2%)] group-hover:text-[hsl(270,70%,50%)] transition-colors">
                                        {opt.label}
                                    </p>
                                    <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] mt-0.5">
                                        {opt.description}
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    {sending === opt.type ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-[hsl(270,70%,50%)]" />
                                    ) : (
                                        <Send className="w-4 h-4 text-[hsl(215.4,16.3%,46.9%)] group-hover:text-[hsl(270,70%,50%)] transition-colors" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Send Log */}
                {logs.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_hsl(222.2_47.4%_11.2%_/_0.08),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.04)]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-primary text-base font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                                Send Log
                            </h2>
                            <button
                                onClick={() => setLogs([])}
                                className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] transition-colors cursor-pointer"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`flex items-start gap-3 px-4 py-3 rounded-lg text-sm ${
                                        log.success
                                            ? "bg-green-50 border border-green-200"
                                            : "bg-red-50 border border-red-200"
                                    }`}
                                >
                                    {log.success ? (
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <p className={`font-secondary font-medium ${log.success ? "text-green-800" : "text-red-800"}`}>
                                            {log.message}
                                        </p>
                                        <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] mt-0.5">
                                            {log.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
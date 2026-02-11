"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/lib/admin-auth";
import { ShieldAlert, Lock, User } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const ok = await loginAdmin(username, password);
        if (ok) {
            router.push("/admin/dashboard");
        } else {
            setError("Invalid credentials. Access Denied.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-app p-4 font-sans">
            <div className="w-full max-w-sm space-y-8 card p-8">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-danger-soft rounded-xl flex items-center justify-center mb-4">
                        <ShieldAlert className="w-6 h-6 text-danger" />
                    </div>
                    <h1 className="text-h2 text-strong">Restricted Access</h1>
                    <p className="text-body">Internal Admin System Only</p>
                </div>

                {error && (
                    <div className="p-3 bg-danger-soft border border-danger rounded-lg text-danger text-xs font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-overline pl-1">Admin ID</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input pl-10 pr-4 py-3 text-sm"
                                placeholder="admin@123"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-overline pl-1">Passkey</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input pl-10 pr-4 py-3 text-sm"
                                placeholder="••••••"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full btn-primary mt-4"
                    >
                        Authenticate
                    </button>
                </form>

                <p className="text-overline text-center font-mono">
                    IP LOGGED • SECURE CONNECTION
                </p>
            </div>
        </div>
    );
}

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
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans">
            <div className="w-full max-w-sm space-y-8 bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-red-900/20 rounded-xl flex items-center justify-center mb-4">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-100">Restricted Access</h1>
                    <p className="text-sm text-zinc-500">Internal Admin System Only</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-xs font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-zinc-500 pl-1">Admin ID</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                                placeholder="admin@123"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-zinc-500 pl-1">Passkey</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                                placeholder="••••••"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-zinc-100 text-zinc-950 font-bold py-3 rounded-xl hover:bg-white transition-colors mt-4"
                    >
                        Authenticate
                    </button>
                </form>

                <p className="text-[10px] text-zinc-600 text-center font-mono">
                    IP LOGGED • SECURE CONNECTION
                </p>
            </div>
        </div>
    );
}

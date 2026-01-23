"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { User, Mail, Save } from "lucide-react";

export default function ProfileEditor() {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.displayName || "");
            setEmail(user.email || "");
        }
    }, [user]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setSuccess(false);

        try {
            await updateProfile(user, { displayName: name });
            await updateDoc(doc(db, "users", user.uid), {
                displayName: name
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to update profile:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
                <p className="text-zinc-500">Manage your account settings and preferences.</p>
            </header>

            <form onSubmit={handleUpdate} className="space-y-6 bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div>
                    <label className="block text-sm font-bold mb-2">Display Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
                            placeholder="Your Name"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            value={email}
                            disabled
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold hover:opacity-80 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                    {success && <span className="ml-4 text-green-600 font-bold text-sm animate-in fade-in">Saved successfully!</span>}
                </div>
            </form>
        </div>
    );
}

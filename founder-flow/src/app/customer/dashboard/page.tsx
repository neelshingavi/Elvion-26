"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyActivity, ensureCustomerProfile } from "@/lib/customer-service";
import {
    Zap,
    TrendingUp,
    MessageSquare,
    Gift
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function CustomerDashboard() {
    const { user } = useAuth();
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            try {
                await ensureCustomerProfile(user.uid, user.email!);
                const events = await getMyActivity(user.uid);
                setActivity(events);
            } catch (error) {
                console.error("Failed to load dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-6 h-6 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Your Impact
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    You have helped validate <span className="font-bold text-black dark:text-white">{activity.length} startups</span> so far.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Validation Card */}
                <div className="p-8 rounded-3xl bg-black text-white dark:bg-white dark:text-black relative overflow-hidden">
                    <div className="relative z-10 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 dark:bg-black/10 backdrop-blur rounded-full text-xs font-bold uppercase tracking-widest">
                            <TrendingUp className="w-3 h-3" />
                            Top Request
                        </div>
                        <h2 className="text-3xl font-bold">Test "FinFlow AI"</h2>
                        <p className="text-zinc-400 dark:text-zinc-600 max-w-sm">
                            A fintech startup needs feedback on their new budgeting dashboard.
                        </p>
                        <Link
                            href="/customer/products"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black dark:bg-black dark:text-white rounded-xl font-bold hover:scale-105 transition-transform"
                        >
                            Start Testing
                        </Link>
                    </div>
                </div>

                {/* Rewards / Status */}
                <div className="p-8 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                            <Gift className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-xl">Early Adopter Perks</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">Feedback Points</span>
                            <span className="font-bold">120 pts</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="w-[30%] h-full bg-purple-500" />
                        </div>
                        <p className="text-xs text-zinc-500">80 pts until next reward tier</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity Stream */}
            <section className="space-y-4">
                <h3 className="font-bold text-lg">Recent Activations</h3>
                <div className="space-y-0">
                    {activity.length > 0 ? (
                        activity.map((event, i) => (
                            <div key={event.id} className="flex gap-4 p-4 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <div className="mt-1">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-zinc-400" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium text-sm">
                                        {event.eventType === "view_product" ? "Viewed product page" : "Submitted feedback"}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {formatDistanceToNow(event.timestamp.toDate())} ago
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-zinc-500 text-sm italic py-4">No recent activity</div>
                    )}
                </div>
            </section>
        </div>
    );
}

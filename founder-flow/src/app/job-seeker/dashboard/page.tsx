"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getJobSeekerProfile, getMyApplications } from "@/lib/job-seeker-service";
import { JobSeekerProfile } from "@/lib/types/job-seeker";
import {
    Activity,
    Briefcase,
    CheckCircle2,
    Search,
    ChevronRight,
    Target
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function JobSeekerDashboard() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            try {
                const [profileData, appData] = await Promise.all([
                    getJobSeekerProfile(user.uid),
                    getMyApplications(user.uid)
                ]);
                setProfile(profileData);
                setApplications(appData);
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
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Hello, {profile?.displayName.split(" ")[0] || "Talent"}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                        You have <span className="text-black dark:text-white font-medium">{applications.length} active applications</span>.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-full text-sm font-bold shadow-lg">
                    <Activity className="w-4 h-4" />
                    Readiness Score: {profile?.readinessScore || 0}/100
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Action Panel */}
                    <div className="p-8 rounded-3xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-black relative overflow-hidden">
                        <div className="relative z-10 space-y-4">
                            <h2 className="text-2xl font-bold">Find your next role</h2>
                            <p className="text-zinc-400 dark:text-zinc-600 max-w-sm">
                                Use our AI matching engine to find startups where you'll make the biggest impact.
                            </p>
                            <Link
                                href="/job-seeker/matches"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black dark:bg-black dark:text-white rounded-xl font-bold hover:scale-105 transition-transform"
                            >
                                View Matches
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-zinc-800 to-transparent dark:from-zinc-200 opacity-50" />
                    </div>

                    {/* Application Tracker */}
                    <section className="space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-zinc-500" />
                            Active Applications
                        </h3>
                        {applications.length > 0 ? (
                            <div className="space-y-3">
                                {applications.map((app) => (
                                    <div key={app.id} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold">Role Application</h4>
                                            <p className="text-xs text-zinc-500">Applied {formatDistanceToNow(app.appliedAt.toDate())} ago</p>
                                        </div>
                                        <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold uppercase tracking-wide">
                                            {app.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 italic">
                                No active applications. Start by viewing your matches.
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <Target className="w-4 h-4 text-zinc-400" />
                            Skill Gaps
                        </h3>
                        <p className="text-sm text-zinc-500">Based on your target roles, consider improving:</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs font-bold">GraphQL</span>
                            <span className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs font-bold">System Design</span>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                            Profile Strength
                        </h3>
                        <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[85%]" />
                        </div>
                        <p className="text-xs text-zinc-500 text-right font-bold">85% Complete</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

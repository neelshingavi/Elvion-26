"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getJobMatches, getJobSeekerProfile } from "@/lib/job-seeker-service";
import { JobMatch, JobSeekerProfile } from "@/lib/types/job-seeker";
import { Startup } from "@/lib/startup-service";
import {
    Briefcase,
    Building,
    MapPin,
    ArrowUpRight,
    Zap
} from "lucide-react";
import Link from "next/link";

interface MatchResult {
    startup: Startup;
    match: JobMatch;
}

export default function MatchesPage() {
    const { user } = useAuth();
    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            try {
                const profile = await getJobSeekerProfile(user.uid);
                if (profile) {
                    const matchData = await getJobMatches(profile);
                    setMatches(matchData);
                }
            } catch (error) {
                console.error("Failed to load matches:", error);
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
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Startup Matches
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    We found {matches.length} startups that need your specific skills.
                </p>
            </header>

            <div className="space-y-4">
                {matches.length > 0 ? (
                    matches.map(({ startup, match }) => (
                        <div
                            key={startup.startupId}
                            className="group p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all hover:shadow-lg flex flex-col md:flex-row gap-6 md:items-start"
                        >
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-xl">{startup.idea}</h3>
                                        <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                                            <Building className="w-4 h-4" />
                                            <span className="capitalize">{startup.stage.replace(/_/g, " ")}</span>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${match.matchScore >= 80 ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                                            match.matchScore >= 50 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                                "bg-zinc-100 text-zinc-600"
                                        }`}>
                                        {match.matchScore}% Match
                                    </span>
                                </div>

                                <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed max-w-2xl">
                                    {match.reason}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-600 font-medium flex items-center gap-1">
                                        <Zap className="w-3 h-3" />
                                        High Impact
                                    </span>
                                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-600 font-medium flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        Remote
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[140px]">
                                <button className="w-full py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg">
                                    Apply Now
                                </button>
                                <button className="w-full py-3 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                    Save
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <p className="text-zinc-500 italic">No matches found yet. Try updating your profile skills.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

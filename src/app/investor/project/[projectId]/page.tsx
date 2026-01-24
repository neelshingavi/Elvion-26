"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import {
    checkInvestorAccess,
    getProjectSnapshot,
    getProjectMetrics,
    getRiskAnalysis,
    getDecisionHistory,
    getInvestorUpdates
} from "@/lib/investor-service";
import {
    Shield,
    TrendingUp,
    AlertTriangle,
    FileText,
    Activity,
    Lock,
    Clock,
    CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function InvestorProjectDashboard() {
    const { user } = useAuth();
    const params = useParams();
    const projectId = params.projectId as string;

    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);

    // Data States
    const [snapshot, setSnapshot] = useState<any>(null);
    const [metrics, setMetrics] = useState<any[]>([]);
    const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
    const [decisions, setDecisions] = useState<any[]>([]);
    const [updates, setUpdates] = useState<any[]>([]);

    useEffect(() => {
        const loadProjectData = async () => {
            if (!user || !projectId) return;

            try {
                // 1. Verify Access
                const access = await checkInvestorAccess(user.uid, projectId);
                if (!access) {
                    setAccessDenied(true);
                    setLoading(false);
                    return;
                }

                // 2. Load Modules in parallel
                const [snapData, metricsData, riskData, decisionsData, updatesData] = await Promise.all([
                    getProjectSnapshot(projectId),
                    getProjectMetrics(projectId),
                    getRiskAnalysis(projectId),
                    getDecisionHistory(projectId),
                    getInvestorUpdates(projectId)
                ]);

                setSnapshot(snapData);
                setMetrics(metricsData);
                setRiskAnalysis(riskData);
                setDecisions(decisionsData);
                setUpdates(updatesData);

            } catch (error) {
                console.error("Error loading project data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadProjectData();
    }, [user, projectId]);

    if (loading) return <div className="p-8">Loading secure investor view...</div>;

    if (accessDenied) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Lock className="w-16 h-16 text-zinc-300" />
                <h2 className="text-xl font-bold">Access Restricted</h2>
                <p className="text-zinc-500">You do not have active permissions to view this project.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Top Bar: Snapshot */}
            <header className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-start shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold">{snapshot?.name || "Startup Name"}</h1>
                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase rounded">
                            {snapshot?.stage || "Seed"}
                        </span>
                    </div>
                    <p className="text-zinc-500">{snapshot?.industry} • {snapshot?.location}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-1">Execution Velocity</div>
                    <div className="text-xl font-bold text-green-600 flex items-center justify-end gap-1">
                        <Activity className="w-4 h-4" />
                        High
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Metrics & Execution */}
                <div className="lg:col-span-2 space-y-8">

                    {/* 7.2 Traction & Metrics */}
                    <section className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" /> Traction Signals
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {metrics.length > 0 ? metrics.slice(0, 4).map((m, i) => (
                                <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                                    <div className="text-xs text-zinc-500 uppercase">{m.metricName}</div>
                                    <div className="text-2xl font-bold mt-1">{m.metricValue}</div>
                                    <div className="text-xs text-zinc-400 mt-1">{m.timePeriod}</div>
                                </div>
                            )) : (
                                <div className="col-span-4 text-center py-8 text-zinc-400 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                    No verified metrics available yet.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 7.3 Execution Intelligence */}
                    <section className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" /> Execution Intelligence
                        </h3>
                        <div className="space-y-4">
                            {/* Mock Execution items if no API data yet */}
                            <div className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl flex justify-between items-center">
                                <div>
                                    <div className="font-medium">Product Roadmap Adherence</div>
                                    <div className="text-sm text-zinc-500">Completed 8/10 planned sprints on time.</div>
                                </div>
                                <div className="text-green-600 font-bold">92%</div>
                            </div>
                            <div className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl flex justify-between items-center">
                                <div>
                                    <div className="font-medium">Decision Speed</div>
                                    <div className="text-sm text-zinc-500">Average time to resolution: 2 days.</div>
                                </div>
                                <div className="text-indigo-600 font-bold">Top 10%</div>
                            </div>
                        </div>
                    </section>

                    {/* 7.5 Decision History */}
                    <section className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" /> Key Decisions
                        </h3>
                        <div className="space-y-4">
                            {decisions.length > 0 ? decisions.map((d, i) => (
                                <div key={i} className="flex gap-4 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-lg transition-colors">
                                    <div className="mt-1">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                    </div>
                                    <div>
                                        <div className="font-medium">{d.title}</div>
                                        <p className="text-sm text-zinc-500 mb-1">{d.context}</p>
                                        <div className="flex gap-2 text-xs">
                                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">Conf: {d.confidenceScore}%</span>
                                            <span className="text-zinc-400">{d.decisionDate?.toDate?.().toLocaleDateString() || "Recent"}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-zinc-500 text-sm italic">No major decision logs visible to investors yet.</div>
                            )}
                        </div>
                    </section>

                </div>

                {/* Right Column: AI Insights & Risk */}
                <div className="space-y-8">

                    {/* 7.4 AI Risk Analysis */}
                    <section className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-500" /> Risk Radar
                        </h3>
                        {riskAnalysis ? (
                            <div className="space-y-6">
                                {[
                                    { label: "Market Risk", data: riskAnalysis.marketRisk },
                                    { label: "Execution Risk", data: riskAnalysis.executionRisk },
                                    { label: "Team Risk", data: riskAnalysis.teamRisk },
                                    { label: "Product Risk", data: riskAnalysis.productRisk },
                                ].map((risk, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{risk.label}</span>
                                            <span className={`px-2 rounded text-[10px] font-bold uppercase ${risk.data?.severity === "HIGH" ? "bg-red-100 text-red-700" :
                                                    risk.data?.severity === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                                                        "bg-green-100 text-green-700"
                                                }`}>{risk.data?.severity || "UNKNOWN"}</span>
                                        </div>
                                        <p className="text-xs text-zinc-500 leading-relaxed mb-2">
                                            {risk.data?.evidence || "No sufficient data to analyze risk."}
                                        </p>
                                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${risk.data?.severity === "HIGH" ? "bg-red-500" :
                                                        risk.data?.severity === "MEDIUM" ? "bg-amber-500" :
                                                            "bg-green-500"
                                                    }`}
                                                style={{ width: risk.data?.severity === "HIGH" ? "80%" : risk.data?.severity === "MEDIUM" ? "50%" : "20%" }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Shield className="w-12 h-12 text-zinc-200 mx-auto mb-2" />
                                <p className="text-zinc-400 text-sm">AI Risk Analysis pending data collection.</p>
                            </div>
                        )}
                    </section>

                    {/* 8. Fundraising Readiness */}
                    <section className="bg-gradient-to-br from-indigo-900 to-purple-900 p-6 rounded-2xl text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-2">Fundraising Readiness</h3>
                            <div className="text-4xl font-bold mb-4">72/100</div>
                            <div className="space-y-2 text-sm text-indigo-200">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-400" /> Strong Team Signal
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400" /> CAC/LTV needs validation
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-2xl" />
                    </section>

                    {/* 9. Updates */}
                    <section className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" /> Founder Updates
                        </h3>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {updates.length > 0 ? updates.map((u, i) => (
                                <div key={i} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                                    <div className="font-medium text-sm">{u.title}</div>
                                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{u.summary}</p>
                                    <div className="text-[10px] text-zinc-400 mt-2 text-right">
                                        {u.createdAt?.toDate?.().toLocaleDateString()}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-zinc-500 text-sm">No updates sent yet.</div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

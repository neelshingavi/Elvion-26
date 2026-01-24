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
    CheckCircle,
    ArrowUpRight,
    MapPin,
    Zap,
    ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

export default function InvestorProjectDashboard() {
    const { user } = useAuth();
    const params = useParams();
    const projectId = params.projectId as string;

    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);

    const [snapshot, setSnapshot] = useState<any>(null);
    const [metrics, setMetrics] = useState<any[]>([]);
    const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
    const [decisions, setDecisions] = useState<any[]>([]);
    const [updates, setUpdates] = useState<any[]>([]);

    useEffect(() => {
        const loadProjectData = async () => {
            if (!user || !projectId) return;

            try {
                const access = await checkInvestorAccess(user.uid, projectId);
                if (!access) {
                    setAccessDenied(true);
                    setLoading(false);
                    return;
                }

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

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Secure Handshake...</span>
        </div>
    );

    if (accessDenied) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-3xl">
                    <Lock className="w-12 h-12 text-zinc-400" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
                    <p className="text-zinc-500 max-w-xs mx-auto">This project requires authenticated investor permissions that are currently inactive or expired.</p>
                </div>
                <button className="px-6 py-2.5 bg-zinc-900 border-none dark:bg-white text-white dark:text-black font-bold rounded-xl text-sm transition-transform hover:scale-105">
                    Request Activation
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-24 animate-in fade-in duration-700">
            {/* Project Header Snapshot */}
            <header className="bg-white dark:bg-zinc-900/50 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm gap-8 transition-all hover:shadow-md">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-xl">
                            {snapshot?.name?.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-bold tracking-tight">{snapshot?.name || "Startup Entity"}</h1>
                                <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase tracking-widest rounded border border-indigo-500/20">
                                    {snapshot?.stage || "Venture"}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                                <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {snapshot?.industry}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {snapshot?.location}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-12 w-full md:w-auto px-2">
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pulse Velocity</div>
                        <div className="text-xl font-bold text-green-600 dark:text-green-500 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            OPTIMAL
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Data Confidence</div>
                        <div className="text-xl font-bold text-indigo-500">98.2%</div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

                {/* Primary Data Column */}
                <div className="lg:col-span-2 space-y-12">

                    {/* Traction Signals */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-indigo-500" /> Traction Signals
                            </h3>
                            <button className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-indigo-500 transition-colors">Historical View</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {metrics.length > 0 ? metrics.slice(0, 4).map((m, i) => (
                                <div key={i} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm transition-all hover:shadow-md group">
                                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-4 group-hover:text-indigo-500 transition-colors">{m.metricName}</div>
                                    <div className="text-3xl font-bold tracking-tight">{m.metricValue}</div>
                                    <div className="text-[10px] text-zinc-500 mt-2 font-medium">{m.timePeriod}</div>
                                </div>
                            )) : (
                                <div className="col-span-4 py-16 text-center bg-zinc-50 dark:bg-zinc-950/50 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                                    <TrendingUp className="w-8 h-8 text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
                                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Awaiting Verification</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Execution Intelligence View */}
                    <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <Zap className="w-5 h-5 text-amber-500" /> Execution Intelligence
                            </h3>
                            <div className="text-xs font-bold px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 uppercase">AI Audited</div>
                        </div>
                        <div className="space-y-4">
                            <IntelligenceRow label="Product Roadmap Adherence" value="92%" sub="Completed 8/10 planned sprints on time." />
                            <IntelligenceRow label="Decision Velocity" value="Top 10%" sub="Average time to resolution: 2 days." />
                            <IntelligenceRow label="Agent Consistency" value="96.5%" sub="Foundational logic alignment remains high." />
                        </div>
                    </section>

                    {/* Decision Logs */}
                    <section className="space-y-6">
                        <h3 className="text-xl font-bold px-2 flex items-center gap-3">
                            <Clock className="w-5 h-5 text-zinc-400" /> Decision History
                        </h3>
                        <div className="space-y-3">
                            {decisions.length > 0 ? decisions.map((d, i) => (
                                <div key={i} className="group flex gap-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl transition-all hover:bg-zinc-50 dark:hover:bg-zinc-950/50 shadow-sm">
                                    <div className="flex-none pt-1">
                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/10" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="font-bold tracking-tight text-lg group-hover:text-indigo-600 transition-colors">{d.title}</div>
                                        <p className="text-sm text-zinc-500 leading-relaxed font-medium">{d.context}</p>
                                        <div className="flex gap-4 pt-3 items-center">
                                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">Conf: {d.confidenceScore}%</span>
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{d.decisionDate?.toDate?.().toLocaleDateString() || "RECENT"}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-zinc-500 text-sm italic py-4">No major decision logs currently exposed for third-party review.</div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Insight Column */}
                <div className="space-y-12 h-fit md:sticky md:top-12">

                    {/* Risk Radar Section */}
                    <section className="bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden space-y-8">
                        <div className="flex items-center justify-between relative z-10">
                            <h3 className="text-lg font-bold flex items-center gap-3 text-white">
                                <Shield className="w-5 h-5 text-indigo-400" /> Risk Radar
                            </h3>
                            <button className="text-[10px] font-black text-white/40 uppercase tracking-tighter hover:text-white transition-colors">Details</button>
                        </div>
                        {riskAnalysis ? (
                            <div className="space-y-8 relative z-10">
                                {[
                                    { label: "Market Risk", data: riskAnalysis.marketRisk },
                                    { label: "Execution Risk", data: riskAnalysis.executionRisk },
                                    { label: "Team Risk", data: riskAnalysis.teamRisk },
                                    { label: "Product Risk", data: riskAnalysis.productRisk },
                                ].map((risk, i) => (
                                    <div key={i} className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-bold text-zinc-300">{risk.label}</span>
                                            <span className={`text-[10px] font-black tracking-widest uppercase ${risk.data?.severity === "HIGH" ? "text-red-500" :
                                                    risk.data?.severity === "MEDIUM" ? "text-amber-500" :
                                                        "text-green-500"
                                                }`}>{risk.data?.severity || "VALIDATING"}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: risk.data?.severity === "HIGH" ? "85%" : risk.data?.severity === "MEDIUM" ? "45%" : "15%" }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                className={`h-full rounded-full ${risk.data?.severity === "HIGH" ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]" :
                                                        risk.data?.severity === "MEDIUM" ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]" :
                                                            "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                                                    }`}
                                            />
                                        </div>
                                        <p className="text-[10px] text-zinc-500 leading-normal font-medium h-8 line-clamp-2">
                                            {risk.data?.evidence || "Analyzing direct execution signals for anomalous patterns."}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="relative z-10 py-12 text-center space-y-4">
                                <Shield className="w-12 h-12 text-white/5 mx-auto" />
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Quantifying Risk Factors...</p>
                            </div>
                        )}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    </section>

                    {/* Fundraising Readiness Score */}
                    <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 dark:from-indigo-900 dark:to-zinc-950 p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-xl">
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-2 text-indigo-200">
                                <ArrowUpRight className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Raise Readiness</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-6xl font-black tracking-tighter">72</span>
                                <span className="text-indigo-200/50 pb-2 font-bold text-xl select-none">/100</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-xs font-bold text-green-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Capital Attraction: High
                                </div>
                                <div className="flex items-center gap-3 text-xs font-bold text-amber-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Story Alignment Index: 88%
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-1000" />
                    </div>

                    {/* Updates Section */}
                    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-3">
                                <FileText className="w-5 h-5 text-indigo-500" /> Intelligence Updates
                            </h3>
                            <button className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors">Archive</button>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                            {updates.length > 0 ? updates.map((u, i) => (
                                <div key={i} className="p-5 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-indigo-500/30">
                                    <div className="font-bold text-sm mb-1">{u.title}</div>
                                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3 mb-2">{u.summary}</p>
                                    <div className="text-[10px] font-bold text-zinc-400 flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> {u.createdAt?.toDate?.().toLocaleDateString()}
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center text-zinc-300 dark:text-zinc-800 italic">No formal summaries shared this period.</div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function IntelligenceRow({ label, value, sub }: any) {
    return (
        <div className="p-6 border border-zinc-100 dark:border-zinc-800 rounded-3xl flex justify-between items-center group hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-all shadow-sm">
            <div className="space-y-1">
                <div className="font-bold group-hover:text-indigo-600 transition-colors uppercase text-[10px] tracking-widest text-zinc-400">{label}</div>
                <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{sub}</div>
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{value}</div>
        </div>
    );
}

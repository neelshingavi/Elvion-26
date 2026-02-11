"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe,
    TrendingUp,
    TrendingDown,
    Building2,
    AlertTriangle,
    Sparkles,
    Search,
    RefreshCw,
    ExternalLink,
    Plus,
    ChevronRight,
    BarChart3,
    Newspaper,
    Gavel,
    IndianRupee,
    ArrowUp,
    ArrowDown,
    Minus,
    Clock,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Competitor {
    id: string;
    name: string;
    website?: string;
    description: string;
    lastFunding?: {
        amount: string;
        round: string;
        date: Date;
        investors: string[];
    };
    pricing?: string[];
    features?: string[];
    alerts: CompetitorAlert[];
    lastUpdated: Date;
}

interface CompetitorAlert {
    id: string;
    type: "funding" | "pricing" | "feature" | "launch" | "team";
    title: string;
    description: string;
    date: Date;
    isRead: boolean;
}

interface MarketTrend {
    keyword: string;
    volume: number;
    trend: "up" | "stable" | "down";
    relevanceScore: number;
    change: number;
}

interface RegulatoryUpdate {
    id: string;
    title: string;
    summary: string;
    impact: "high" | "medium" | "low";
    source: string;
    date: Date;
    category: string;
}

interface MarketPulse {
    overallSentiment: number; // -100 to 100
    trendingTopics: string[];
    fundingActivity: {
        totalDeals: number;
        totalAmount: string;
        change: number;
    };
    trends: MarketTrend[];
}

// Sample data for demonstration
const SAMPLE_TRENDS: MarketTrend[] = [
    { keyword: "AI-powered automation", volume: 45000, trend: "up", relevanceScore: 92, change: 34 },
    { keyword: "SaaS pricing models", volume: 32000, trend: "up", relevanceScore: 88, change: 12 },
    { keyword: "B2B marketplace India", volume: 28000, trend: "stable", relevanceScore: 85, change: 2 },
    { keyword: "Startup funding India 2024", volume: 56000, trend: "down", relevanceScore: 78, change: -8 },
    { keyword: "Digital payments UPI", volume: 89000, trend: "up", relevanceScore: 72, change: 45 }
];

const SAMPLE_REGULATORY: RegulatoryUpdate[] = [
    {
        id: "reg1",
        title: "DPDP Act 2023 Compliance Deadline",
        summary: "Digital Personal Data Protection Act requires all data processors to implement consent management systems by Q2 2024.",
        impact: "high",
        source: "Ministry of Electronics and IT",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        category: "Data Privacy"
    },
    {
        id: "reg2",
        title: "RBI Guidelines on Digital Lending",
        summary: "Updated guidelines require all digital lending platforms to disclose APR and ensure transparent fee structures.",
        impact: "medium",
        source: "Reserve Bank of India",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        category: "Fintech"
    },
    {
        id: "reg3",
        title: "Startup India Tax Benefits Extended",
        summary: "Section 80-IAC benefits extended for eligible startups registered until March 2025.",
        impact: "low",
        source: "Income Tax Department",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        category: "Taxation"
    }
];

const SAMPLE_COMPETITORS: Competitor[] = [
    {
        id: "comp1",
        name: "TechVenture Labs",
        website: "techventurelabs.in",
        description: "AI-powered business analytics platform for SMEs",
        lastFunding: {
            amount: "₹25 Cr",
            round: "Series A",
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            investors: ["Sequoia India", "Nexus Venture Partners"]
        },
        pricing: ["Free tier", "₹4,999/mo Pro", "Enterprise custom"],
        features: ["Dashboard analytics", "AI insights", "Team collaboration"],
        alerts: [
            {
                id: "alert1",
                type: "funding",
                title: "Raised Series A",
                description: "Raised ₹25 Cr from Sequoia India",
                date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                isRead: false
            }
        ],
        lastUpdated: new Date()
    },
    {
        id: "comp2",
        name: "GrowthPilot",
        website: "growthpilot.io",
        description: "Growth automation suite for D2C brands",
        pricing: ["₹2,999/mo Starter", "₹9,999/mo Growth", "₹29,999/mo Scale"],
        features: ["Email automation", "WhatsApp marketing", "Customer segmentation"],
        alerts: [
            {
                id: "alert2",
                type: "feature",
                title: "Launched WhatsApp integration",
                description: "New WhatsApp Business API integration for marketing",
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                isRead: true
            }
        ],
        lastUpdated: new Date()
    }
];

export default function MarketIntelPage() {
    const { user } = useAuth();

    // State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"pulse" | "competitors" | "regulatory">("pulse");
    const [startupId, setStartupId] = useState<string | null>(null);
    const [industry, setIndustry] = useState<string>("");

    // Data states
    const [marketPulse, setMarketPulse] = useState<MarketPulse>({
        overallSentiment: 65,
        trendingTopics: ["AI automation", "UPI payments", "D2C growth"],
        fundingActivity: {
            totalDeals: 142,
            totalAmount: "₹8,420 Cr",
            change: -12
        },
        trends: SAMPLE_TRENDS
    });
    const [competitors, setCompetitors] = useState<Competitor[]>(SAMPLE_COMPETITORS);
    const [regulatory, setRegulatory] = useState<RegulatoryUpdate[]>(SAMPLE_REGULATORY);

    // Modals
    const [showAddCompetitor, setShowAddCompetitor] = useState(false);
    const [newCompetitor, setNewCompetitor] = useState({ name: "", website: "", description: "" });
    const [searchQuery, setSearchQuery] = useState("");

    // Helper to safely convert Firestore timestamps or strings to Date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toDate = (date: any): Date => {
        if (!date) return new Date();
        if (date instanceof Date) return date;
        if (date.toDate && typeof date.toDate === "function") return date.toDate(); // Firestore Timestamp
        if (date.seconds) return new Date(date.seconds * 1000); // Firestore Timestamp raw object
        return new Date(date);
    };

    // Load data
    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const userData = userDoc.data();
                const activeStartupId = userData?.activeStartupId;

                if (activeStartupId) {
                    setStartupId(activeStartupId);

                    // Get startup industry
                    const startupDoc = await getDoc(doc(db, "startups", activeStartupId));
                    if (startupDoc.exists()) {
                        setIndustry(startupDoc.data().industry || "");
                    }

                    // Load saved market intel
                    const intelDoc = await getDoc(doc(db, "marketIntel", activeStartupId));
                    if (intelDoc.exists()) {
                        const data = intelDoc.data();
                        if (data.pulse) setMarketPulse(data.pulse);
                        
                        if (data.competitors) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const formattedCompetitors = data.competitors.map((c: any) => ({
                                ...c,
                                lastUpdated: toDate(c.lastUpdated),
                                lastFunding: c.lastFunding ? {
                                    ...c.lastFunding,
                                    date: toDate(c.lastFunding.date)
                                } : undefined,
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                alerts: (c.alerts || []).map((a: any) => ({
                                    ...a,
                                    date: toDate(a.date)
                                }))
                            }));
                            setCompetitors(formattedCompetitors);
                        }

                        if (data.regulatory) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const formattedRegulatory = data.regulatory.map((r: any) => ({
                                ...r,
                                date: toDate(r.date)
                            }));
                            setRegulatory(formattedRegulatory);
                        }
                    } else {
                        // If no data exists, trigger generation automatically
                        // triggerGeneration(activeStartupId, user.uid);
                        // For now, we keep sample data as fallback until user clicks refresh
                    }
                }
            } catch (error) {
                console.error("Error loading market intel:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    // Refresh market data
    const refreshData = async () => {
        if (!startupId || !user) return;
        setRefreshing(true);

        try {
            const token = await user.getIdToken();
            const response = await fetch("/api/market-intel", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ startupId })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error?.message || "Failed to fetch market intel");
            }
            
            if (data.pulse) setMarketPulse(data.pulse);
            
            if (data.competitors) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedCompetitors = data.competitors.map((c: any) => ({
                    ...c,
                    lastUpdated: new Date(),
                    lastFunding: c.lastFunding ? {
                        ...c.lastFunding,
                        date: c.lastFunding.date ? new Date(c.lastFunding.date) : new Date()
                    } : undefined,
                    alerts: c.alerts || []
                }));
                setCompetitors(formattedCompetitors);
            }

            if (data.regulatory) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedRegulatory = data.regulatory.map((r: any) => ({
                    ...r,
                    date: r.date ? new Date(r.date) : new Date()
                }));
                setRegulatory(formattedRegulatory);
            }

        } catch (error) {
            console.error("Error refreshing market data:", error);
            // Optional: Add toast notification here
        } finally {
            setRefreshing(false);
        }
    };

    // Add competitor
    const handleAddCompetitor = async () => {
        if (!newCompetitor.name || !startupId) return;

        const competitor: Competitor = {
            id: `comp_${Date.now()}`,
            name: newCompetitor.name,
            website: newCompetitor.website,
            description: newCompetitor.description,
            alerts: [],
            lastUpdated: new Date()
        };

        const updated = [...competitors, competitor];
        setCompetitors(updated);

        // Save to Firestore
        await setDoc(doc(db, "marketIntel", startupId), {
            startupId,
            competitors: updated,
            updatedAt: serverTimestamp()
        }, { merge: true });

        setNewCompetitor({ name: "", website: "", description: "" });
        setShowAddCompetitor(false);
    };

    // Format relative time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatRelativeTime = (dateInput: Date | any) => {
        const date = toDate(dateInput);
        const diff = Date.now() - date.getTime();
        const days = Math.floor(diff / 86400000);

        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return `${Math.floor(days / 30)} months ago`;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-zinc-500">Loading market intelligence...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Globe className="w-8 h-8 text-indigo-500" />
                            Market Intelligence
                        </h1>
                        <p className="text-zinc-500 mt-1">
                            India-focused market data, competitor tracking, and regulatory updates
                        </p>
                    </div>

                    <button
                        onClick={refreshData}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                        {refreshing ? "Refreshing..." : "Refresh Data"}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 w-fit">
                    {[
                        { id: "pulse", label: "Market Pulse", icon: TrendingUp },
                        { id: "competitors", label: "Competitors", icon: Building2 },
                        { id: "regulatory", label: "Regulatory", icon: Gavel }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as "pulse" | "competitors" | "regulatory")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-white dark:bg-zinc-700 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-700"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>


                {/* Market Pulse Tab */}
                {activeTab === "pulse" && (
                    <div className="space-y-6">
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Sentiment Card */}
                            <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-bold text-zinc-500">Market Sentiment</span>
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-bold",
                                        marketPulse.overallSentiment > 50
                                            ? "bg-green-100 text-green-700"
                                            : marketPulse.overallSentiment > 20
                                                ? "bg-yellow-100 text-yellow-700"
                                                : "bg-red-100 text-red-700"
                                    )}>
                                        {marketPulse.overallSentiment > 50 ? "Bullish" : marketPulse.overallSentiment > 20 ? "Neutral" : "Bearish"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl font-black">
                                        {marketPulse.overallSentiment}
                                    </div>
                                    <div className="flex-1">
                                        <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    marketPulse.overallSentiment > 50
                                                        ? "bg-green-500"
                                                        : marketPulse.overallSentiment > 20
                                                            ? "bg-yellow-500"
                                                            : "bg-red-500"
                                                )}
                                                style={{ width: `${Math.max(0, Math.min(100, (marketPulse.overallSentiment + 100) / 2))}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Funding Activity */}
                            <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-bold text-zinc-500">India Funding (This Month)</span>
                                    <IndianRupee className="w-5 h-5 text-zinc-400" />
                                </div>
                                <div className="text-4xl font-black mb-2">
                                    {marketPulse.fundingActivity.totalAmount}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-zinc-500">{marketPulse.fundingActivity.totalDeals} deals</span>
                                    <span className={cn(
                                        "flex items-center gap-1",
                                        marketPulse.fundingActivity.change > 0 ? "text-green-500" : "text-red-500"
                                    )}>
                                        {marketPulse.fundingActivity.change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                        {Math.abs(marketPulse.fundingActivity.change)}% vs last month
                                    </span>
                                </div>
                            </div>

                            {/* Trending Topics */}
                            <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-bold text-zinc-500">Trending in {industry || "Your Industry"}</span>
                                    <Sparkles className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    {marketPulse.trendingTopics.slice(0, 3).map((topic, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900/30 rounded text-indigo-500 text-xs font-bold flex items-center justify-center">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm font-medium">{topic}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Keyword Trends */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                                <h3 className="font-black text-lg">Keyword Trends</h3>
                                <p className="text-sm text-zinc-500">Search volume and trends for relevant keywords</p>
                            </div>
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {marketPulse.trends.map((trend, i) => (
                                    <div key={i} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                                trend.trend === "up" && "bg-green-100 dark:bg-green-900/30 text-green-600",
                                                trend.trend === "stable" && "bg-zinc-100 dark:bg-zinc-800 text-zinc-600",
                                                trend.trend === "down" && "bg-red-100 dark:bg-red-900/30 text-red-600"
                                            )}>
                                                {trend.trend === "up" && <TrendingUp className="w-5 h-5" />}
                                                {trend.trend === "stable" && <Minus className="w-5 h-5" />}
                                                {trend.trend === "down" && <TrendingDown className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold">{trend.keyword}</div>
                                                <div className="text-sm text-zinc-500">
                                                    {trend.volume.toLocaleString()} monthly searches
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={cn(
                                                    "flex items-center gap-1 font-bold",
                                                    trend.change > 0 ? "text-green-500" : trend.change < 0 ? "text-red-500" : "text-zinc-500"
                                                )}>
                                                    {trend.change > 0 ? "+" : ""}{trend.change}%
                                                </div>
                                                <div className="text-xs text-zinc-400">vs last month</div>
                                            </div>
                                            <div className="w-24">
                                                <div className="text-xs text-zinc-400 mb-1">Relevance</div>
                                                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full"
                                                        style={{ width: `${trend.relevanceScore}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Competitors Tab */}
                {activeTab === "competitors" && (
                    <div className="space-y-6">
                        {/* Search and Add */}
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search competitors..."
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <button
                                onClick={() => setShowAddCompetitor(true)}
                                className="flex items-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Add Competitor
                            </button>
                        </div>

                        {/* Competitors Grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {competitors
                                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map(competitor => (
                                    <motion.div
                                        key={competitor.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="font-black text-lg">{competitor.name}</h3>
                                                    {competitor.website && (
                                                        <a
                                                            href={`https://${competitor.website}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-indigo-500 hover:underline flex items-center gap-1"
                                                        >
                                                            {competitor.website}
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                                {competitor.alerts.filter(a => !a.isRead).length > 0 && (
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                                        {competitor.alerts.filter(a => !a.isRead).length} new
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                                {competitor.description}
                                            </p>

                                            {competitor.lastFunding && (
                                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl mb-4">
                                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold text-sm">
                                                        <IndianRupee className="w-4 h-4" />
                                                        {competitor.lastFunding.round}: {competitor.lastFunding.amount}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 mt-1">
                                                        {competitor.lastFunding.investors.join(", ")}
                                                    </div>
                                                </div>
                                            )}

                                            {competitor.pricing && (
                                                <div className="mb-4">
                                                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Pricing</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {competitor.pricing.map((price, i) => (
                                                            <span key={i} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium">
                                                                {price}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {competitor.alerts.length > 0 && (
                                                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Recent Activity</div>
                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                    {competitor.alerts.slice(0, 2).map((alert: any) => (
                                                        <div key={alert.id} className="flex items-start gap-2 text-sm py-2">
                                                            <div className={cn(
                                                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                                                                alert.type === "funding" && "bg-green-100 text-green-600",
                                                                alert.type === "feature" && "bg-blue-100 text-blue-600",
                                                                alert.type === "pricing" && "bg-yellow-100 text-yellow-600"
                                                            )}>
                                                                {alert.type === "funding" && <IndianRupee className="w-3 h-3" />}
                                                                {alert.type === "feature" && <Sparkles className="w-3 h-3" />}
                                                                {alert.type === "pricing" && <BarChart3 className="w-3 h-3" />}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{alert.title}</div>
                                                                <div className="text-xs text-zinc-500">{formatRelativeTime(alert.date)}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                        </div>

                        {competitors.length === 0 && (
                            <div className="py-16 text-center">
                                <Building2 className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
                                <h3 className="text-lg font-bold mb-2">No competitors tracked yet</h3>
                                <p className="text-zinc-500 mb-4">Start tracking your competition to stay ahead</p>
                                <button
                                    onClick={() => setShowAddCompetitor(true)}
                                    className="px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold text-sm"
                                >
                                    Add First Competitor
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Regulatory Tab */}
                {activeTab === "regulatory" && (
                    <div className="space-y-6">
                        {/* Alert Banner */}
                        {regulatory.some(r => r.impact === "high") && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                                <div>
                                    <div className="font-bold text-red-900 dark:text-red-100">High Impact Updates</div>
                                    <div className="text-sm text-red-700 dark:text-red-300">
                                        {regulatory.filter(r => r.impact === "high").length} regulatory changes require your attention
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Regulatory Updates List */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-lg">Regulatory Updates</h3>
                                    <p className="text-sm text-zinc-500">India-focused compliance and regulatory changes</p>
                                </div>
                                <select className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">
                                    <option>All Categories</option>
                                    <option>Data Privacy</option>
                                    <option>Fintech</option>
                                    <option>Taxation</option>
                                </select>
                            </div>

                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {regulatory.map(update => (
                                    <div key={update.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                                update.impact === "high" && "bg-red-100 dark:bg-red-900/30 text-red-600",
                                                update.impact === "medium" && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600",
                                                update.impact === "low" && "bg-green-100 dark:bg-green-900/30 text-green-600"
                                            )}>
                                                <Gavel className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-bold">{update.title}</h4>
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-full text-xs font-bold uppercase",
                                                        update.impact === "high" && "bg-red-100 text-red-700",
                                                        update.impact === "medium" && "bg-yellow-100 text-yellow-700",
                                                        update.impact === "low" && "bg-green-100 text-green-700"
                                                    )}>
                                                        {update.impact} impact
                                                    </span>
                                                </div>
                                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                                                    {update.summary}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatRelativeTime(update.date)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Newspaper className="w-3 h-3" />
                                                        {update.source}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                                                        {update.category}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                                                <ChevronRight className="w-5 h-5 text-zinc-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ask AI About Compliance */}
                        <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Sparkles className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-lg">Regulatory Checker</h3>
                                    <p className="text-white/80 text-sm">
                                        Ask AI about compliance requirements for your startup
                                    </p>
                                </div>
                                <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:scale-105 transition-all">
                                    Ask AI
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Competitor Modal */}
            <AnimatePresence>
                {showAddCompetitor && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40"
                            onClick={() => setShowAddCompetitor(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-x-4 top-[20%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50"
                        >
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <h2 className="text-xl font-black">Add Competitor</h2>
                                <button
                                    onClick={() => setShowAddCompetitor(false)}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newCompetitor.name}
                                        onChange={(e) => setNewCompetitor(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., TechCorp"
                                        className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                                        Website
                                    </label>
                                    <input
                                        type="text"
                                        value={newCompetitor.website}
                                        onChange={(e) => setNewCompetitor(prev => ({ ...prev, website: e.target.value }))}
                                        placeholder="techcorp.com"
                                        className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                                        Description
                                    </label>
                                    <textarea
                                        value={newCompetitor.description}
                                        onChange={(e) => setNewCompetitor(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Brief description of what they do..."
                                        className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowAddCompetitor(false)}
                                    className="px-6 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddCompetitor}
                                    disabled={!newCompetitor.name}
                                    className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all disabled:opacity-50"
                                >
                                    Add Competitor
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

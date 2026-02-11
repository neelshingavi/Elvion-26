
"use client";
import React from "react";
import { WeeklyReview } from "@/types/weekly-review";
import { DollarSign, TrendingUp, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProps {
    data: WeeklyReview;
    updateData: (updates: Partial<WeeklyReview>) => void;
}

export function StepSnapshot({ data, updateData }: StepProps) {
    const metrics = data.metrics || { revenue: "", keyMetric: { name: "", value: "" } };

    const handleChange = (field: string, value: string | number) => {
        updateData({
            metrics: {
                ...metrics,
                [field]: value
            }
        });
    };

    const handleKeyMetricChange = (field: string, value: string | number) => {
        updateData({
            metrics: {
                ...metrics,
                keyMetric: {
                    ...metrics.keyMetric,
                    [field]: value
                }
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Revenue */}
                <div className="p-4 bg-surface-alt rounded-xl border border-subtle focus-within:border-primary focus-within:ring-2 ring-primary/20 transition-all">
                    <label className="flex items-center gap-2 text-sm font-bold text-muted mb-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        Weekly Revenue (MRR/ARR)
                    </label>
                    <input
                        type="text"
                        value={metrics.revenue}
                        onChange={(e) => handleChange("revenue", e.target.value)}
                        placeholder="$0.00"
                        className="w-full bg-transparent text-2xl font-black text-strong outline-none placeholder:text-muted/30"
                    />
                </div>

                {/* Burn Rate (Optional) */}
                <div className="p-4 bg-surface-alt rounded-xl border border-subtle focus-within:border-primary focus-within:ring-2 ring-primary/20 transition-all">
                    <label className="flex items-center gap-2 text-sm font-bold text-muted mb-2">
                        <Activity className="w-4 h-4 text-rose-500" />
                        Burn Rate (Optional)
                    </label>
                    <input
                        type="text"
                        value={metrics.burnRate || ""}
                        onChange={(e) => handleChange("burnRate", e.target.value)}
                        placeholder="$0.00"
                        className="w-full bg-transparent text-2xl font-black text-strong outline-none placeholder:text-muted/30"
                    />
                </div>
            </div>

            {/* Key Metric */}
            <div className="p-6 bg-surface-alt rounded-xl border border-subtle">
                <h3 className="text-lg font-black flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    North Star Metric
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted uppercase">Metric Name</label>
                        <input
                            type="text"
                            value={metrics.keyMetric.name}
                            onChange={(e) => handleKeyMetricChange("name", e.target.value)}
                            placeholder="e.g. Active Users, Signups"
                            className="w-full p-3 bg-surface rounded-lg border border-subtle focus:border-primary outline-none font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted uppercase">Current Value</label>
                        <input
                            type="text"
                            value={metrics.keyMetric.value}
                            onChange={(e) => handleKeyMetricChange("value", e.target.value)}
                            placeholder="0"
                            className="w-full p-3 bg-surface rounded-lg border border-subtle focus:border-primary outline-none font-bold"
                        />
                    </div>
                </div>
            </div>

            {/* Team Size */}
            <div className="p-4 bg-surface-alt rounded-xl border border-subtle w-fit">
                <label className="flex items-center gap-2 text-sm font-bold text-muted mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    Team Size
                </label>
                <input
                    type="number"
                    value={metrics.teamSize || ""}
                    onChange={(e) => handleChange("teamSize", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-24 bg-transparent text-xl font-bold text-strong outline-none placeholder:text-muted/30"
                />
            </div>
        </div>
    );
}

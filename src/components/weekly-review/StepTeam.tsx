
"use client";
import React from "react";
import { WeeklyReview } from "@/types/weekly-review";
import { Battery, Zap, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProps {
    data: WeeklyReview;
    updateData: (updates: Partial<WeeklyReview>) => void;
}

export function StepTeam({ data, updateData }: StepProps) {
    const sentiment = data.sentiment || { productivityRating: 5, energyLevel: 5, hiringProgress: "" };

    const update = (field: string, value: number | string) => {
        updateData({
            sentiment: { ...sentiment, [field]: value }
        });
    };

    const renderRating = (label: string, icon: React.ReactNode, value: number, field: string, colorClass: string) => (
        <div className="p-6 bg-surface rounded-2xl border border-subtle">
            <div className="flex items-center gap-2 mb-4">
                {icon}
                <h4 className="font-bold text-lg">{label}</h4>
            </div>

            <div className="flex justify-between items-center mb-2">
                <span className="text-muted text-xs font-bold uppercase">Low</span>
                <span className="text-2xl font-black">{value}/10</span>
                <span className="text-muted text-xs font-bold uppercase">High</span>
            </div>

            <input
                type="range"
                min="1" max="10" step="1"
                value={value}
                onChange={(e) => update(field, parseInt(e.target.value))}
                className={cn("w-full h-2 rounded-lg appearance-none cursor-pointer bg-surface-alt accent-[var(--color)]", colorClass === "primary" ? "accent-primary" : "accent-warning")}
                style={{ backgroundImage: `linear-gradient(to right, currentColor 0%, currentColor ${value * 10}%, transparent ${value * 10}%, transparent 100%)` }}
            />
            <p className="text-center text-sm text-muted mt-3">
                {value < 4 ? "Rough week?" : value > 8 ? "Firing on all cylinders!" : "Steady pace."}
            </p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderRating("Founder Energy", <Battery className="w-5 h-5 text-warning" />, sentiment.energyLevel, "energyLevel", "warning")}
                {renderRating("Team Productivity", <Zap className="w-5 h-5 text-primary" />, sentiment.productivityRating, "productivityRating", "primary")}
            </div>

            <div className="p-6 bg-surface rounded-2xl border border-subtle">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                    Hiring & Operations Notes
                </h4>
                <textarea
                    value={sentiment.hiringProgress || ""}
                    onChange={(e) => update("hiringProgress", e.target.value)}
                    placeholder="Any key hires in pipeline? Operational changes?"
                    className="w-full bg-surface-alt rounded-lg p-3 min-h-[100px] outline-none border border-transparent focus:border-primary"
                />
            </div>
        </div>
    );
}

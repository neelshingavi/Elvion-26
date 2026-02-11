"use client";

import { Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    onSave?: () => void;
    saving?: boolean;
    className?: string;
    actions?: React.ReactNode;
}

export function ProfileSection({
    title,
    description,
    children,
    onSave,
    saving,
    className,
    actions
}: ProfileSectionProps) {
    return (
        <section className={cn("card p-8 lg:p-10 space-y-6 relative overflow-hidden", className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-h3 text-strong">{title}</h3>
                    {description && <p className="text-caption mt-1">{description}</p>}
                </div>
                <div className="flex items-center gap-2">
                    {actions}
                    {onSave && (
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="p-2 hover:bg-surface-alt rounded-xl transition-colors text-subtle hover:text-primary disabled:opacity-50"
                            title="Save changes"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {children}
            </div>
        </section>
    );
}

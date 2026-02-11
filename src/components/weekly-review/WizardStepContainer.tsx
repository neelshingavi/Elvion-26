
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface WizardGlobalProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    progress: number;
}

export function WizardStepContainer({ children, title, subtitle, progress }: WizardGlobalProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto w-full p-6 md:p-8"
        >
            <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h2 className="text-3xl font-black mb-1 text-strong">{title}</h2>
                        <p className="text-muted text-lg">{subtitle}</p>
                    </div>
                    <span className="text-sm font-bold text-muted">{Math.round(progress)}% Complete</span>
                </div>
                <div className="h-1.5 w-full bg-surface-alt rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 50 }}
                    />
                </div>
            </div>

            <div className="bg-surface border border-subtle rounded-2xl shadow-sm p-6 md:p-10 min-h-[400px]">
                {children}
            </div>
        </motion.div>
    );
}

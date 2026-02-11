"use client";

import { Sidebar, navItems } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Rocket, Menu, X, Sparkles } from "lucide-react";
import { FullPageLoader } from "@/components/ui/Loader";
import { AISidekick } from "@/components/shared/AISidekick";

export default function FounderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidekickOpen, setIsSidekickOpen] = useState(false);
    const pathname = usePathname(); // Need this for active state



    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (userData && !userData.isOnboardingCompleted && !userData.activeStartupId) {
                // Redirect to onboarding if not completed (and not a legacy user with active startup)
                router.push("/onboarding");
            }
        }
    }, [user, userData, loading, router]);

    if (loading) return <FullPageLoader />;
    if (!user) return null;

    return (
        <div className="flex h-screen bg-app">
            <Sidebar />

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full p-4 glass z-40 flex items-center justify-between border-b border-subtle">
                <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-primary" />
                    <h1 className="font-bold text-strong">FounderFlow</h1>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 bg-surface-alt rounded-lg text-strong"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-surface animate-in slide-in-from-right duration-200">
                    <div className="p-6 flex items-center justify-between border-b border-subtle">
                        <div className="flex items-center gap-2">
                            <Rocket className="w-5 h-5 text-primary" />
                            <h1 className="font-bold text-xl text-strong">Menu</h1>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 bg-surface-alt rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                        ? "bg-primary-soft text-primary"
                                        : "text-muted hover:bg-surface-alt"
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            <main className="flex-1 flex flex-col h-screen overflow-hidden pt-16 md:pt-0">
                <div className="flex-1 h-full overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>

            {/* Global AI Sidekick */}
            <div className="fixed bottom-6 right-6 z-[60]">
                <button
                    onClick={() => setIsSidekickOpen(true)}
                    className="w-14 h-14 rounded-full bg-primary-gradient text-on-primary flex items-center justify-center shadow-float hover:scale-110 active:scale-95 transition-all group relative"
                >
                    <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-success border-2 border-surface rounded-full" />
                </button>
            </div>

            <AISidekick
                isOpen={isSidekickOpen}
                onClose={() => setIsSidekickOpen(false)}
                startupId={userData?.activeStartupId || ""}
                userId={user?.uid || ""}
            />
        </div>
    );
}

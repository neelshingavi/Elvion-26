"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Search,
    Settings,
    LogOut,
    MessageSquare,
    UserCircle,
    Rocket,

    ChevronRight,
    Shield,
    Briefcase,
    Menu,
    X
} from "lucide-react";
import { useState } from "react";

export default function InvestorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { name: "Portfolio", href: "/investor/dashboard", icon: LayoutDashboard },
        { name: "Discovery", href: "/investor/startups", icon: Search },
        { name: "Deals", href: "/investor/deals", icon: Briefcase },

        { name: "Chat", href: "/investor/chats", icon: MessageSquare },
        { name: "Profile", href: "/investor/profile", icon: UserCircle },
    ];

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-50">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 flex flex-col fixed h-full bg-white dark:bg-zinc-950/50 backdrop-blur-xl z-50 hidden md:flex">
                <div className="p-8 pb-10">
                    <div className="flex items-center gap-2 mb-2 group cursor-pointer">
                        <div className="p-1.5 bg-black dark:bg-white rounded-lg transition-transform group-hover:scale-110">
                            <Rocket className="w-5 h-5 text-white dark:text-black" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Founder<span className="text-indigo-500">Flow</span>
                        </h1>
                    </div>
                    <div className="px-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Investor Terminal</span>
                    </div>
                </div>

                <nav className="px-4 space-y-1 flex-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/investor/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
                                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-lg shadow-black/5"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                    }`}
                            >
                                <item.icon className={`w-4 h-4 transition-colors ${isActive ? "" : "group-hover:text-indigo-500"}`} />
                                {item.name}
                                {isActive && (
                                    <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                            <Shield className="w-3 h-3" />
                            System Health
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-green-500 font-bold">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            OPERATIONAL
                        </div>
                    </div>
                    <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-500 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all group">
                        <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full p-4 glass z-40 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-indigo-500" />
                    <h1 className="font-bold text-zinc-900 dark:text-zinc-50">FounderFlow</h1>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-900 dark:text-zinc-100"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-white dark:bg-zinc-950 animate-in slide-in-from-right duration-200">
                    <div className="p-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900">
                        <div className="flex items-center gap-2">
                            <Rocket className="w-5 h-5 text-indigo-500" />
                            <h1 className="font-bold text-xl">Menu</h1>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/investor/dashboard" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                        ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                                        : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
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

            {/* Main Content */}
            {/* Main Content */}
            <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden pt-16 md:pt-0">
                <div className="flex-1 h-full overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

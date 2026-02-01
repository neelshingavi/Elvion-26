"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    History,
    Lightbulb,
    Map,
    CheckSquare,
    MessageSquare,
    LogOut,
    UserCircle,
    Rocket,
    ChevronRight,
    Shield
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export const navItems = [
    { name: "Dashboard", href: "/founder/dashboard", icon: LayoutDashboard },
    { name: "Idea Check", href: "/founder/idea-validation", icon: Lightbulb },
    { name: "Timeline", href: "/founder/timeline", icon: History },
    { name: "Roadmap", href: "/founder/planning", icon: Map },
    { name: "Tasks", href: "/founder/tasks", icon: CheckSquare },
    { name: "Chat", href: "/founder/chats", icon: MessageSquare },
    { name: "Profile", href: "/founder/profile", icon: UserCircle },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden md:flex h-full w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl p-4">
            <div className="p-4 pb-8">
                <div className="flex items-center gap-2 mb-2 group cursor-pointer">
                    <div className="p-1.5 bg-black dark:bg-white rounded-lg transition-transform group-hover:scale-110">
                        <Rocket className="w-5 h-5 text-white dark:text-black" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">
                        Founder<span className="text-indigo-500">Flow</span>
                    </h1>
                </div>
                <div className="px-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Founder Suite</span>
                </div>
            </div>

            <nav className="flex-1 px-2 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-lg shadow-black/5"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "" : "group-hover:text-indigo-500")} />
                            {item.name}
                            {isActive && (
                                <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto space-y-2">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                        <Shield className="w-3 h-3" />
                        Platform Status
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-green-500 font-bold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        SYNCED
                    </div>
                </div>
                <button
                    onClick={() => signOut(auth)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all group"
                >
                    <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}

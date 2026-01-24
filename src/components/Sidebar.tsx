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
    Users,
    MessageSquare,
    LogOut,
    UserCircle
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const navItems = [
    { name: "Dashboard", href: "/founder/dashboard", icon: LayoutDashboard },
    { name: "Idea Check", href: "/founder/idea-validation", icon: Lightbulb },
    { name: "Timeline", href: "/founder/timeline", icon: History },
    { name: "Roadmap", href: "/founder/planning", icon: Map },
    { name: "Tasks", href: "/founder/tasks", icon: CheckSquare },
    { name: "Matches", href: "/founder/matching", icon: Users },
    { name: "Chat", href: "/founder/chat", icon: MessageSquare },
    { name: "Profile", href: "/founder/profile", icon: UserCircle },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4">
            <div className="flex items-center gap-2 px-2 py-4 mb-8">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <span className="text-white dark:text-black font-bold text-lg">F</span>
                </div>
                <span className="font-bold text-xl tracking-tight">FounderFlow</span>
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                                isActive
                                    ? "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"
                                    : "text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-950"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={() => signOut(auth)}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}

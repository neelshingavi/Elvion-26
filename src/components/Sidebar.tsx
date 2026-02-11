"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Lightbulb,
    Target,
    CheckSquare,
    FileText,
    Globe,
    LogOut,
    UserCircle,
    Rocket,
    ChevronRight,
    Shield,
    Calendar,
    Presentation
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export const navItems = [
    { name: "Dashboard", href: "/founder/dashboard", icon: LayoutDashboard },
    { name: "Canvas", href: "/founder/canvas", icon: FileText },
    { name: "Validate Idea", href: "/founder/idea-validation", icon: Lightbulb },
    { name: "Roadmap", href: "/founder/roadmap", icon: Target },
    { name: "Tasks", href: "/founder/tasks", icon: CheckSquare },
    { name: "Weekly Review", href: "/founder/weekly-review", icon: Calendar },
    { name: "Pitch Deck", href: "/founder/pitch-deck", icon: Presentation },
    { name: "Market Intel", href: "/founder/market-intel", icon: Globe },
    { name: "Profile", href: "/founder/profile", icon: UserCircle },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden md:flex h-full w-64 flex-col border-r border-subtle bg-surface p-4">
            <div className="p-4 pb-8">
                <div className="flex items-center gap-2 mb-2 group cursor-pointer">
                    <div className="p-1.5 bg-primary-gradient rounded-lg transition-transform group-hover:scale-110">
                        <Rocket className="w-5 h-5 text-on-primary" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-strong">
                        Founder<span className="text-primary">Flow</span>
                    </h1>
                </div>
                <div className="px-1">
                    <span className="text-overline">Founder Suite</span>
                </div>
            </div>

            <nav className="flex-1 px-2 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-primary-soft text-primary shadow-card"
                                    : "text-muted hover:text-strong hover:bg-surface-alt"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "" : "group-hover:text-primary")} />
                            {item.name}
                            {isActive && (
                                <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto space-y-2">
                <div className="p-4 bg-surface-alt rounded-2xl border border-subtle space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-subtle">
                        <Shield className="w-3 h-3" />
                        Platform Status
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-success font-bold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-soft opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                        SYNCED
                    </div>
                </div>
                <button
                    onClick={() => signOut(auth)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-danger hover:bg-danger-soft transition-all group"
                >
                    <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}

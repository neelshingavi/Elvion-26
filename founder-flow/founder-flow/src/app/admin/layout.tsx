"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAdminLoggedIn, logoutAdmin } from "@/lib/admin-auth";
import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    Rocket,
    LogOut,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (!isAdminLoggedIn()) {
            router.push("/internal-admin-login");
        } else {
            setAuthorized(true);
        }
    }, [router]);

    const handleLogout = () => {
        logoutAdmin();
        router.push("/internal-admin-login");
    };

    if (!authorized) return null;

    const navItems = [
        { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "User Base", href: "/admin/users", icon: Users },
        { name: "Startups", href: "/admin/startups", icon: Rocket },
    ];

    return (
        <div className="flex min-h-screen bg-zinc-950 text-zinc-200">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-zinc-900 p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white fill-current" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white tracking-tight">Admin<span className="text-zinc-500">Panel</span></h1>
                        <p className="text-[10px] text-zinc-500 font-mono">v1.0.0-INTERNAL</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-zinc-900 text-white"
                                        : "text-zinc-500 hover:text-white hover:bg-zinc-900/50"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-950/20 rounded-lg transition-colors mt-auto"
                >
                    <LogOut className="w-4 h-4" />
                    Terminate Session
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

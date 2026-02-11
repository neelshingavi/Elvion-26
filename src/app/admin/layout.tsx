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
    Shield,
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
        let mounted = true;
        const checkSession = async () => {
            const ok = await isAdminLoggedIn();
            if (!mounted) return;
            if (!ok) {
                router.push("/internal-admin-login");
            } else {
                setAuthorized(true);
            }
        };
        checkSession();
        return () => {
            mounted = false;
        };
    }, [router]);

    const handleLogout = async () => {
        await logoutAdmin();
        router.push("/internal-admin-login");
    };

    if (!authorized) return null;

    const navItems = [
        { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "User Base", href: "/admin/users", icon: Users },
        { name: "Startups", href: "/admin/startups", icon: Rocket },
    ];

    return (
        <div className="flex min-h-screen bg-app text-subtle">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-subtle bg-surface p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 bg-danger rounded flex items-center justify-center">
                        <Shield className="w-4 h-4 text-on-primary fill-current" />
                    </div>
                    <div>
                        <h1 className="font-bold text-strong tracking-tight">Admin<span className="text-muted">Panel</span></h1>
                        <p className="text-overline font-mono">v1.0.0-INTERNAL</p>
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
                                        ? "bg-primary-soft text-primary"
                                        : "text-muted hover:text-strong hover:bg-surface-alt"
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
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-danger hover:bg-danger-soft rounded-lg transition-colors mt-auto"
                >
                    <LogOut className="w-4 h-4" />
                    Terminate Session
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}

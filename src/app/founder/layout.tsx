"use client";

import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FounderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) return null;
    if (!user) return null;

    return (
        <div className="flex h-screen bg-[#fafafa] dark:bg-[#050505]">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="flex-1 h-full overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

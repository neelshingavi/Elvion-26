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
            <main className="flex-1 overflow-y-auto p-4">
                <div className="mx-auto max-w-[1600px] h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}

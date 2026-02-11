"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";

export default function AdminStartupsPage() {
    const [startups, setStartups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStartups = async () => {
        try {
            const res = await fetch("/api/admin/startups");
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error?.message || "Failed to fetch startups");
            setStartups(data.startups || []);
        } catch (error) {
            console.error("Error fetching startups:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStartups();
    }, []);

    const handleDelete = async (startupId: string) => {
        if (!window.confirm("ARE YOU SURE? This will permanently delete this startup (including tasks, memory, etc).")) return;

        try {
            const res = await fetch("/api/admin/delete-startup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startupId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error?.message || "Failed to delete startup");
            setStartups(prev => prev.filter(s => s.id !== startupId));
        } catch (error) {
            console.error("Failed to delete startup:", error);
            alert("Failed to delete startup.");
        }
    };

    if (loading) return <div className="text-muted">Loading startups...</div>;

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Startup Database</h1>
                    <p className="text-subtle">Monitor new ventures and their growth.</p>
                </div>
                <div className="px-3 py-1 bg-surface rounded-full border border-subtle text-xs text-subtle">
                    Total: {startups.length}
                </div>
            </header>

            <div className="border border-subtle rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left text-subtle">
                    <thead className="text-xs uppercase bg-surface text-muted">
                        <tr>
                            <th className="px-6 py-3">Startup</th>
                            <th className="px-6 py-3">Idea</th>
                            <th className="px-6 py-3">Stage</th>
                            <th className="px-6 py-3">Created</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-surface">
                        {startups.map((startup) => (
                            <tr key={startup.id} className="hover:bg-surface/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">
                                    {startup.name || "Untitled Startup"}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="truncate max-w-xs" title={startup.idea}>
                                        {startup.idea}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-secondary-soft text-secondary">
                                        {startup.stage?.replace(/_/g, " ") || "NEW"}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {startup.createdAt?.seconds
                                        ? formatDistanceToNow(new Date(startup.createdAt.seconds * 1000), { addSuffix: true })
                                        : "N/A"}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(startup.id)}
                                        className="text-danger hover:text-danger hover:bg-danger-soft p-2 rounded-lg transition-all"
                                        title="Delete Startup"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

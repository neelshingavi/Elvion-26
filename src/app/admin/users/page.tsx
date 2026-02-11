"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            // Fetch all users - in production use pagination
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error?.message || "Failed to fetch users");
            setUsers(data.users || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId: string) => {
        if (!window.confirm("ARE YOU SURE? This will permanently delete this user and cannot be undone.")) return;

        try {
            const res = await fetch("/api/admin/delete-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: userId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error?.message || "Failed to delete user");
            // Refresh list
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            console.error("Failed to delete user:", error);
            alert("Failed to delete user. Check console.");
        }
    };

    if (loading) return <div className="text-muted">Loading registry...</div>;

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-h2 text-strong">User Registry</h1>
                    <p className="text-subtle">Manage platform access and roles.</p>
                </div>
                <div className="px-3 py-1 bg-surface rounded-full border border-subtle text-xs text-subtle">
                    Total: {users.length}
                </div>
            </header>

            <div className="card rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left text-subtle">
                    <thead className="text-xs uppercase bg-surface text-muted">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Joined</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle bg-surface">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-surface-alt transition-colors">
                                <td className="px-6 py-4 font-medium text-strong">
                                    <div>{user.displayName || "Unknown"}</div>
                                    <div className="text-xs text-muted">{user.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === "founder" ? "bg-info-soft text-info" :
                                        user.role === "admin" ? "bg-primary-soft text-primary" :
                                            "bg-surface-alt text-subtle"
                                        }`}>
                                        {user.role || "N/A"}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {user.createdAt?.seconds
                                        ? formatDistanceToNow(new Date(user.createdAt.seconds * 1000), { addSuffix: true })
                                        : "N/A"}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="text-danger hover:bg-danger-soft p-2 rounded-lg transition-all"
                                        title="Delete User"
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

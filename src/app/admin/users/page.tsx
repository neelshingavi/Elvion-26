"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            // Fetch all users - in production use pagination
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
            await deleteDoc(doc(db, "users", userId));
            // Refresh list
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            console.error("Failed to delete user:", error);
            alert("Failed to delete user. Check console.");
        }
    };

    if (loading) return <div className="text-zinc-500">Loading registry...</div>;

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Registry</h1>
                    <p className="text-zinc-400">Manage platform access and roles.</p>
                </div>
                <div className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-xs text-zinc-400">
                    Total: {users.length}
                </div>
            </header>

            <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left text-zinc-400">
                    <thead className="text-xs uppercase bg-zinc-900 text-zinc-500">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Joined</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-zinc-900/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">
                                    <div>{user.displayName || "Unknown"}</div>
                                    <div className="text-xs text-zinc-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === "founder" ? "bg-blue-900/30 text-blue-400" :
                                        user.role === "admin" ? "bg-purple-900/30 text-purple-400" :
                                            "bg-zinc-800 text-zinc-400"
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
                                        className="text-red-500 hover:text-red-400 hover:bg-red-950/30 p-2 rounded-lg transition-all"
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

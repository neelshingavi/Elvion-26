"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Folder, ArrowRight, Activity, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserStartups, setActiveStartupId, Startup } from "@/lib/startup-service";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Startup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!authLoading && !user) {
                router.push("/login");
                setLoading(false);
                return;
            }
            if (user) {
                try {
                    const data = await getUserStartups(user.uid);
                    setProjects(data);
                } catch (error) {
                    console.error("Failed to fetch projects:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchProjects();
    }, [user, authLoading, router]);

    const handleSelectProject = async (startupId: string) => {
        if (!user) return;
        try {
            await setActiveStartupId(user.uid, startupId);
            router.push("/founder/dashboard");
        } catch (error) {
            console.error("Failed to set active project:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#050505]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Your Projects
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                            Select a project to manage or start a new one.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/projects/create")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:scale-105 transition-transform shadow-lg shadow-black/5"
                    >
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/50">
                        <Folder className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">No projects yet</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-sm">
                            Create your first startup project to get started with FounderFlow's AI agents.
                        </p>
                        <button
                            onClick={() => router.push("/projects/create")}
                            className="text-sm font-bold text-black dark:text-white underline underline-offset-4 hover:opacity-70"
                        >
                            Create a Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project, index) => (
                            <motion.button
                                key={project.startupId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => handleSelectProject(project.startupId)}
                                className="group relative flex flex-col items-start p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-black/5 transition-all text-left w-full"
                            >
                                <div className="flex items-start justify-between w-full mb-4">
                                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl group-hover:bg-zinc-950 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase",
                                        project.stage === "idea_submitted" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                            project.stage === "execution_active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                    )}>
                                        {project.stage.replace(/_/g, " ")}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {project.name}
                                </h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-6">
                                    {project.industry ? project.industry : "General"} • {project.idea}
                                </p>

                                <div className="mt-auto flex items-center justify-between w-full text-xs text-zinc-400 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>
                                            {project.updatedAt?.toDate ? new Date(project.updatedAt.toDate()).toLocaleDateString() : 'Just now'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-black dark:text-white">
                                        Open
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

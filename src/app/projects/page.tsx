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
            <div className="min-h-screen flex items-center justify-center bg-app">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-subtle border-t-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-h1 text-strong">
                            Your Projects
                        </h1>
                        <p className="text-body mt-1">
                            Select a project to manage or start a new one.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/projects/create")}
                        className="btn-primary hover:scale-105 transition-transform"
                    >
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div className="card border-dashed p-12 flex flex-col items-center justify-center">
                        <Folder className="w-12 h-12 text-subtle mb-4" />
                        <h3 className="text-h3 text-strong">No projects yet</h3>
                        <p className="text-body mb-6 text-center max-w-sm">
                            Create your first startup project to get started with FounderFlow's AI agents.
                        </p>
                        <button
                            onClick={() => router.push("/projects/create")}
                            className="text-sm font-bold text-primary underline underline-offset-4 hover:opacity-70"
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
                                className="group relative flex flex-col items-start p-6 card hover:border-primary transition-all text-left w-full"
                            >
                                <div className="flex items-start justify-between w-full mb-4">
                                    <div className="p-3 bg-surface-alt rounded-xl transition-colors text-primary">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase",
                                        project.stage === "idea_submitted" ? "bg-info-soft text-info" :
                                            project.stage === "execution_active" ? "bg-success-soft text-success" :
                                                "bg-surface-alt text-muted"
                                    )}>
                                        {project.stage.replace(/_/g, " ")}
                                    </span>
                                </div>

                                <h3 className="text-h3 text-strong mb-2 group-hover:text-primary transition-colors">
                                    {project.name}
                                </h3>
                                <p className="text-body line-clamp-2 mb-6">
                                    {project.industry ? project.industry : "General"} • {project.idea}
                                </p>

                                <div className="mt-auto flex items-center justify-between w-full text-xs text-subtle font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>
                                            {project.updatedAt?.toDate ? new Date(project.updatedAt.toDate()).toLocaleDateString() : 'Just now'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
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

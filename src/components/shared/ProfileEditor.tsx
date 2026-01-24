"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, sendPasswordResetEmail, getAuth } from "firebase/auth";
import {
    User, Mail, Save, Phone, MapPin, GraduationCap, Briefcase,
    Award, Clock, ShieldCheck, Lock, Loader2, Link, Plus,
    Trash2, Star, Github, Linkedin, Globe, X, ExternalLink, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { UserData } from "@/lib/startup-service";

export default function ProfileEditor() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState<UserData[]>([]);
    const [showConnections, setShowConnections] = useState(false);

    // Profile Data
    const [formData, setFormData] = useState({
        displayName: "",
        email: "",
        about: "",
        skills: "",
        age: "",
        phone: "",
        education: "",
        location: "",
        photoURL: "",
        socialLinks: { linkedin: "", twitter: "", website: "" },
        projects: [] as Array<{ name: string, description: string, role: string, link: string }>,
        score: 0
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            const docRef = doc(db, "users", user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                setFormData({
                    displayName: user.displayName || "",
                    email: user.email || "",
                    about: data.about || "",
                    skills: data.skills || "",
                    age: data.age || "",
                    phone: data.phone || "",
                    education: data.education || "",
                    location: data.location || "",
                    photoURL: data.photoURL || "",
                    socialLinks: data.socialLinks || { linkedin: "", twitter: "", website: "" },
                    projects: data.projects || [],
                    score: data.score || 0
                });
            }
        };
        fetchProfile();

        // Fetch connections
        const fetchConnections = async () => {
            if (!user) return;
            const { getConnectedUsers } = await import("@/lib/connection-service");
            const { getUserData } = await import("@/lib/startup-service");
            const ids = await getConnectedUsers(user.uid);
            const profiles = await Promise.all(ids.map(id => getUserData(id)));
            setConnectedUsers(profiles.filter(Boolean) as UserData[]);
        };
        fetchConnections();
    }, [user]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setSuccess(false);

        try {
            await updateProfile(user, { displayName: formData.displayName });
            await updateDoc(doc(db, "users", user.uid), {
                displayName: formData.displayName,
                about: formData.about,
                skills: formData.skills,
                age: formData.age,
                phone: formData.phone,
                education: formData.education,
                location: formData.location,
                photoURL: formData.photoURL,
                socialLinks: formData.socialLinks,
                projects: formData.projects,
                score: formData.score
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to update profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        setResetSent(true);
        try {
            const auth = getAuth();
            await sendPasswordResetEmail(auth, user.email);
            setTimeout(() => setResetSent(false), 5000);
        } catch (error) {
            console.error("Reset failed:", error);
        }
    };

    const handleSocialChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [field]: value }
        }));
    };

    const handleAddProject = () => {
        setFormData(prev => ({
            ...prev,
            projects: [...prev.projects, { name: "", description: "", role: "", link: "" }]
        }));
    };

    const handleRemoveProject = (index: number) => {
        setFormData(prev => ({
            ...prev,
            projects: prev.projects.filter((_, i) => i !== index)
        }));
    };

    const handleProjectChange = (index: number, field: string, value: string) => {
        const newProjects = [...formData.projects];
        (newProjects[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, projects: newProjects }));
    };

    const InputField = ({ label, icon: Icon, name, type = "text", placeholder, disabled }: any) => (
        <div className="space-y-1.5 flex-1 min-w-[180px]">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">{label}</label>
            <div className="relative group">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                    type={type}
                    value={(formData as any)[name]}
                    disabled={disabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, [name]: e.target.value }))}
                    className={cn(
                        "w-full pl-9 pr-3 py-2 text-[11px] font-bold rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-indigo-500/50 outline-none transition-all",
                        disabled && "bg-zinc-50 dark:bg-zinc-950 text-zinc-400 cursor-not-allowed"
                    )}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                        Command Hub Identity
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter">Founder Profile</h1>
                    <p className="text-[11px] text-zinc-500 font-medium">Personal intelligence parameters for ecosystem matching.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    System Verified
                </div>
            </header>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: General Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-6">
                        <div className="flex flex-wrap gap-4">
                            <InputField label="Display Name" icon={User} name="displayName" placeholder="Pratamesh" />
                            <InputField label="Email Address" icon={Mail} name="email" placeholder="email@example.com" disabled />
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <InputField label="Phone Number" icon={Phone} name="phone" placeholder="+91 123..." />
                            <InputField label="Age" icon={Clock} name="age" type="number" placeholder="25" />
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <InputField label="Current Location" icon={MapPin} name="location" placeholder="Mumbai, IN" />
                            <InputField label="Avatar Source (URL)" icon={Plus} name="photoURL" placeholder="https://..." />
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <InputField label="Education Hub" icon={GraduationCap} name="education" placeholder="Computer Science" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Executive Summary / About</label>
                            <textarea
                                value={formData.about}
                                onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                                rows={3}
                                className="w-full px-4 py-3 text-[11px] font-medium rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-indigo-500/50 outline-none transition-all leading-relaxed"
                                placeholder="Vision and core background summary..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Specialized Skillset</label>
                            <div className="relative group">
                                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 group-focus-within:text-indigo-500" />
                                <input
                                    value={formData.skills}
                                    onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                                    className="w-full pl-9 pr-3 py-2 text-[11px] font-bold rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-indigo-500/50 outline-none transition-all"
                                    placeholder="e.g. Scaling, Fullstack Engineering, Sales..."
                                />
                            </div>
                        </div>

                        <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800" />

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Globe className="w-4 h-4 text-indigo-500" />
                                Public Presence
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">LinkedIn</label>
                                    <div className="relative group">
                                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            value={formData.socialLinks.linkedin}
                                            onChange={(e) => handleSocialChange("linkedin", e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-[11px] font-bold rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-indigo-500/50 outline-none"
                                            placeholder="linkedin.com/in/..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Twitter/X</label>
                                    <div className="relative group">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                        <input
                                            value={formData.socialLinks.twitter}
                                            onChange={(e) => handleSocialChange("twitter", e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-[11px] font-bold rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-indigo-500/50 outline-none"
                                            placeholder="twitter.com/..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Portfolio</label>
                                    <div className="relative group">
                                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            value={formData.socialLinks.website}
                                            onChange={(e) => handleSocialChange("website", e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-[11px] font-bold rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-indigo-500/50 outline-none"
                                            placeholder="yourwebsite.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800" />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Award className="w-4 h-4 text-indigo-500" />
                                    Notable Projects
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleAddProject}
                                    className="text-[10px] bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Insert Project
                                </button>
                            </div>

                            <div className="grid gap-4">
                                {formData.projects.map((project, index) => (
                                    <div key={index} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 relative group">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveProject(index)}
                                            className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                            <input
                                                value={project.name}
                                                onChange={(e) => handleProjectChange(index, "name", e.target.value)}
                                                className="bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 px-1 py-1 text-sm font-bold outline-none"
                                                placeholder="Project Name"
                                            />
                                            <input
                                                value={project.role}
                                                onChange={(e) => handleProjectChange(index, "role", e.target.value)}
                                                className="bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 px-1 py-1 text-[11px] font-medium outline-none"
                                                placeholder="Role / Capacity"
                                            />
                                        </div>
                                        <textarea
                                            value={project.description}
                                            onChange={(e) => handleProjectChange(index, "description", e.target.value)}
                                            rows={2}
                                            className="w-full bg-transparent text-[11px] text-zinc-600 dark:text-zinc-400 outline-none resize-none"
                                            placeholder="Review of the impact..."
                                        />
                                        <div className="mt-2 flex items-center gap-2">
                                            <Link className="w-3 h-3 text-zinc-400" />
                                            <input
                                                value={project.link}
                                                onChange={(e) => handleProjectChange(index, "link", e.target.value)}
                                                className="bg-transparent text-[10px] text-zinc-500 w-full outline-none"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                ))}
                                {formData.projects.length === 0 && (
                                    <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                        <p className="text-[11px] text-zinc-400 font-medium">No projects linked to profile yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-black text-[11px] hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20"
                            >
                                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                Synchronize
                            </button>
                            {success && (
                                <p className="text-green-500 font-black text-[9px] uppercase tracking-widest animate-in fade-in">
                                    Profile Persisted
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Security & Bio */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xl space-y-4 relative overflow-hidden">
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 opacity-80 mb-1">
                                    <Star className="w-4 h-4 fill-white/20" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Founder Score</span>
                                </div>
                                <div className="text-4xl font-black tracking-tighter">
                                    {formData.score}
                                    <span className="text-lg opacity-40 ml-1">/ 100</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-full border-4 border-white/20 flex items-center justify-center bg-white/10 backdrop-blur-md">
                                <span className="text-[10px] font-bold">A+</span>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black shadow-xl space-y-4 relative overflow-hidden">
                        <div className="relative z-10 space-y-4">
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Access Control</h3>
                                <p className="text-[10px] opacity-60 font-medium">Manage your biometric/auth keys.</p>
                            </div>

                            <button
                                type="button"
                                onClick={handlePasswordReset}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/5 hover:bg-white/10 transition-all font-bold text-[11px]"
                            >
                                <div className="flex items-center gap-2">
                                    <Lock className="w-3.5 h-3.5 opacity-60" />
                                    Change Password
                                </div>
                                <span className="text-[9px] opacity-50 underline">Instruction via Email</span>
                            </button>
                            {resetSent && <p className="text-[9px] text-indigo-400 font-bold text-center">Reset vector dispatched.</p>}
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    </div>

                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                            System Stats
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-50 dark:border-zinc-800">
                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">Status</p>
                                <p className="text-[11px] font-black text-indigo-500">ACTIVE</p>
                            </div>
                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-50 dark:border-zinc-800">
                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">Identity</p>
                                <p className="text-[11px] font-black uppercase">Founder</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowConnections(true)}
                            className="w-full mt-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-500 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500/10 transition-all"
                        >
                            Explore Connections ({connectedUsers.length})
                        </button>
                    </div>
                </div>
            </form>

            {/* Connections Overlay */}
            <AnimatePresence>
                {showConnections && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowConnections(false)}
                            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 p-8"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black tracking-tight">Venture Partners</h3>
                                <button onClick={() => setShowConnections(false)} className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {connectedUsers.length > 0 ? connectedUsers.map((u) => (
                                    <div key={u.uid} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 group hover:border-indigo-500/20 transition-all">
                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                            <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.displayName || u.uid}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">{u.displayName}</h4>
                                            <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest truncate">{u.role || "Founder"}</p>
                                        </div>
                                        <button className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 space-y-4">
                                        <Users className="w-12 h-12 text-zinc-100 dark:text-zinc-800 mx-auto" />
                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-relaxed"> No verified connections found <br /> in the network registry. </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

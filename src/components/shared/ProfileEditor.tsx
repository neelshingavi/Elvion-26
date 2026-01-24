"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, sendPasswordResetEmail, getAuth } from "firebase/auth";
import {
    User, Mail, Save, Phone, MapPin, GraduationCap, Briefcase,
    Award, Clock, ShieldCheck, Lock, Loader2, Link, Plus,
    Trash2, Star, Github, Linkedin, Globe, X, ExternalLink, Users, Rocket, ChevronRight
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
        role: "Founder",
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
                    role: data.role || "Founder",
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
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* LinkedIn Style Header Card */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden group">
                {/* Banner */}
                <div className="h-48 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-700" />
                    <button className="absolute top-6 right-6 p-2 bg-black/20 backdrop-blur-md rounded-xl text-white hover:bg-black/40 transition-all border border-white/10 opacity-0 group-hover:opacity-100">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Profile Identity Section */}
                <div className="px-10 pb-10">
                    <div className="relative -mt-20 mb-6 flex justify-between items-end">
                        <div className="relative group/avatar">
                            <div className="w-40 h-40 rounded-full border-[6px] border-white dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-800 shadow-2xl overflow-hidden relative">
                                <img
                                    src={formData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.displayName || user?.uid}`}
                                    className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                                    <Plus className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Update Registry
                            </button>
                            <button
                                onClick={() => setShowConnections(true)}
                                className="px-8 py-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-zinc-600 dark:text-zinc-400"
                            >
                                Partners ({connectedUsers.length})
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
                                    {formData.displayName || "Node_Alpha"}
                                </h1>
                                <p className="text-lg font-medium text-zinc-500">
                                    {formData.role} • {formData.about?.split('.')[0] || "Strategic Ecosystem Node"}
                                </p>
                                <div className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-bold">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {formData.location || "Global Node"}
                                    </div>
                                    <div className="w-1 h-1 bg-zinc-300 rounded-full" />
                                    <div className="text-indigo-500 text-xs font-black uppercase tracking-widest">
                                        {connectedUsers.length} Connections
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:flex flex-col items-end gap-3 text-right">
                                <div className="flex items-center gap-2 group cursor-pointer">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                                        <GraduationCap className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">{formData.education || "University of Innovation"}</span>
                                </div>
                                <div className="flex items-center gap-2 group cursor-pointer">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                                        <Rocket className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Founder Score: {formData.score}/100</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Rail */}
                <div className="lg:col-span-8 space-y-8">
                    {/* About Section */}
                    <section className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 p-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black tracking-tight">About</h3>
                            <button className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400"><Save className="w-4 h-4" /></button>
                        </div>
                        <textarea
                            value={formData.about}
                            onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                            className="w-full bg-transparent text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed outline-none resize-none"
                            placeholder="Share your strategic vision and core background..."
                            rows={4}
                        />
                    </section>

                    {/* Notable Projects Section */}
                    <section className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 p-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black tracking-tight">Experience & Ventures</h3>
                            <button onClick={handleAddProject} className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl hover:bg-indigo-500/20 transition-all"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-10">
                            {formData.projects.map((project, index) => (
                                <div key={index} className="flex gap-6 relative group">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shrink-0">
                                        <Briefcase className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <div className="space-y-2 flex-1 pt-1">
                                        <div className="flex items-center justify-between">
                                            <input
                                                value={project.name}
                                                onChange={(e) => handleProjectChange(index, "name", e.target.value)}
                                                className="text-lg font-black bg-transparent outline-none w-full"
                                                placeholder="Venture Name"
                                            />
                                            <button onClick={() => handleRemoveProject(index)} className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <input
                                            value={project.role}
                                            onChange={(e) => handleProjectChange(index, "role", e.target.value)}
                                            className="text-sm font-bold text-indigo-500 bg-transparent outline-none w-full"
                                            placeholder="Your Role (e.g. Founder & CEO)"
                                        />
                                        <textarea
                                            value={project.description}
                                            onChange={(e) => handleProjectChange(index, "description", e.target.value)}
                                            className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed bg-transparent outline-none w-full resize-none"
                                            placeholder="Describe your impact and mission..."
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Skill-sets Section */}
                    <section className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 p-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black tracking-tight">Ecosystem Skills</h3>
                            <button className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {formData.skills.split(',').map((skill, i) => skill.trim() && (
                                <div key={i} className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:border-indigo-500/30 transition-all flex items-center gap-2 group cursor-default">
                                    {skill.trim()}
                                    <Star className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                        <input
                            value={formData.skills}
                            onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                            placeholder="Update skills (comma separated)..."
                            className="w-full pt-4 bg-transparent border-t border-zinc-50 dark:border-zinc-800 mt-4 outline-none text-xs text-zinc-400 font-bold uppercase tracking-widest"
                        />
                    </section>
                </div>

                {/* Right Rail */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Public Links Card */}
                    <section className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 p-8 space-y-6">
                        <h3 className="text-lg font-black tracking-tight">Public Registry</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800">
                                <Linkedin className="w-5 h-5 text-indigo-500" />
                                <input
                                    value={formData.socialLinks.linkedin}
                                    onChange={(e) => handleSocialChange("linkedin", e.target.value)}
                                    className="bg-transparent text-[11px] font-bold outline-none flex-1"
                                    placeholder="LinkedIn ID"
                                />
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800">
                                <Globe className="w-5 h-5 text-blue-500" />
                                <input
                                    value={formData.socialLinks.website}
                                    onChange={(e) => handleSocialChange("website", e.target.value)}
                                    className="bg-transparent text-[11px] font-bold outline-none flex-1"
                                    placeholder="Portfolio URL"
                                />
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800">
                                <ShieldCheck className="w-5 h-5 text-green-500" />
                                <span className="text-[10px] font-black uppercase text-zinc-400">Identity Secure</span>
                            </div>
                        </div>
                    </section>

                    {/* Metadata Section */}
                    <section className="bg-zinc-950 dark:bg-white p-8 rounded-[2rem] text-white dark:text-black space-y-6 relative overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Executive Parameters</h3>
                                <p className="text-[10px] opacity-60 font-medium">Manage your biometric/auth keys.</p>
                            </div>
                            <button
                                onClick={handlePasswordReset}
                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/5 hover:bg-white/10 transition-all"
                            >
                                <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Lock className="w-4 h-4 opacity-40" /> Reset Keys</span>
                                <ChevronRight className="w-4 h-4 opacity-20" />
                            </button>
                            {resetSent && <p className="text-center text-[10px] text-indigo-400 font-bold">Reset sequence initiated.</p>}
                        </div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
                    </section>

                    {/* Notification/Stats Card */}
                    <section className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 p-8">
                        <div className="flex flex-col gap-6 text-center">
                            <div className="flex gap-4">
                                <div className="flex-1 p-5 bg-zinc-50 dark:bg-zinc-800 rounded-3xl space-y-1">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Age</p>
                                    <p className="text-lg font-black text-indigo-500">{formData.age || "N/A"}</p>
                                </div>
                                <div className="flex-1 p-5 bg-zinc-50 dark:bg-zinc-800 rounded-3xl space-y-1">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</p>
                                    <p className="text-lg font-black text-green-500">Active</p>
                                </div>
                            </div>
                            <InputField label="Phone Node" icon={Phone} name="phone" placeholder="+91..." />
                            <input
                                placeholder="Avatar URL"
                                className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-[10px] font-bold outline-none"
                                value={formData.photoURL}
                                onChange={(e) => setFormData(prev => ({ ...prev, photoURL: e.target.value }))}
                            />
                        </div>
                    </section>
                </div>
            </div>

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

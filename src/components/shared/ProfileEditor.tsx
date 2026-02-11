"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, sendPasswordResetEmail, getAuth } from "firebase/auth";
import {
    User, Mail, Save, Phone, MapPin, GraduationCap, Briefcase,
    Award, Clock, ShieldCheck, Lock, Loader2, Link, Plus,
    Trash2, Star, Github, Linkedin, Globe, X, ExternalLink, Users, Rocket, ChevronRight, Camera, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { UserData } from "@/lib/startup-service";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { onSnapshot } from "firebase/firestore";

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
        bannerURL: "",
        role: "Founder",
        socialLinks: { linkedin: "", twitter: "", website: "" },
        projects: [] as Array<{ name: string, description: string, role: string, link: string }>,
        connectionCount: 0,
        score: 0
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            const docRef = doc(db, "users", user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                const skillsValue = Array.isArray(data.skills) ? data.skills.join(", ") : data.skills || "";
                const ageValue = typeof data.age === "number" ? String(data.age) : data.age || "";
                setFormData(prev => ({
                    ...prev,
                    displayName: user.displayName || "",
                    email: user.email || "",
                    role: data.role || "Founder",
                    about: data.about || "",
                    skills: skillsValue,
                    age: ageValue,
                    phone: data.phone || "",
                    education: data.education || "",
                    location: data.location || "",
                    photoURL: data.photoURL || "",
                    bannerURL: data.bannerURL || "",
                    socialLinks: data.socialLinks || { linkedin: "", twitter: "", website: "" },
                    projects: data.projects || [],
                    connectionCount: data.connectionCount || 0,
                    score: data.score || 0
                }));
            }
        };

        const unsubUser = user ? onSnapshot(doc(db, "users", user.uid), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setFormData(prev => ({
                    ...prev,
                    connectionCount: data.connectionCount || 0,
                    photoURL: data.photoURL || prev.photoURL,
                    bannerURL: data.bannerURL || prev.bannerURL
                }));
            }
        }) : () => { };

        fetchProfile();

        // Fetch connections list for modal
        const fetchConnectionsList = async () => {
            if (!user) return;
            const { getConnectedUsers } = await import("@/lib/connection-service");
            const { getUserData } = await import("@/lib/startup-service");
            const ids = await getConnectedUsers(user.uid);
            const profiles = await Promise.all(ids.map((id: string) => getUserData(id)));
            setConnectedUsers(profiles.filter(Boolean) as UserData[]);
        };
        fetchConnectionsList();

        return () => {
            unsubUser();
        };
    }, [user]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large. Please upload an image smaller than 5MB.");
            return;
        }

        setLoading(true);
        try {
            const fileName = `${type}_${Date.now()}`;
            const storageRef = ref(storage, `users/${user.uid}/${fileName}`);

            // Helpful logging for diagnostics
            console.log(`[Storage] Target Bucket: ${storage.app.options.storageBucket}`);
            console.log(`[Storage] Target Path: users/${user.uid}/${fileName}`);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const field = type === 'avatar' ? 'photoURL' : 'bannerURL';

            // 1. Update Database immediately
            await updateDoc(doc(db, "users", user.uid), {
                [field]: downloadURL
            });

            // 2. Update Auth Profile for avatar
            if (type === 'avatar') {
                await updateProfile(user, { photoURL: downloadURL });
            }

            // 3. Update Local State immediately so user sees it
            setFormData(prev => ({ ...prev, [field]: downloadURL }));

            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (error: any) {
            console.error("[Storage] Upload failed:", error);

            // Alert user with specific diagnostic info
            if (error.message?.includes('404')) {
                alert(`Upload Failed (404):\n- Ensure Firebase Storage is ENABLED in the console.\n- Check if your bucket in .env.local is correct.\n- Current Configured Bucket: ${storage.app.options.storageBucket}`);
            } else if (error.code === 'storage/unauthorized') {
                alert("Security Conflict: Check your Firebase Storage Security Rules.");
            } else {
                alert(`Upload Conflict: ${error.message || "Unknown Failure"}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user) return;
        setLoading(true);
        setSuccess(false);

        try {
            const skillsArray = formData.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            const parsedAge = formData.age ? Number(formData.age) : undefined;

            // Update Auth display name
            await updateProfile(user, { displayName: formData.displayName });

            // Update Firestore with ALL fields
            await updateDoc(doc(db, "users", user.uid), {
                displayName: formData.displayName,
                about: formData.about,
                skills: skillsArray,
                age: Number.isFinite(parsedAge) ? parsedAge : null,
                phone: formData.phone,
                education: formData.education,
                location: formData.location,
                photoURL: formData.photoURL,
                bannerURL: formData.bannerURL,
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
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-subtle pl-1">{label}</label>
            <div className="relative group">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle group-focus-within:text-primary transition-colors" />
                <input
                    type={type}
                    value={(formData as any)[name]}
                    disabled={disabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, [name]: e.target.value }))}
                    className={cn(
                        "input pl-9 pr-3 py-2 text-[11px] font-semibold",
                        disabled && "bg-surface-alt text-subtle cursor-not-allowed"
                    )}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* LinkedIn Style Header Card */}
            <div className="relative card overflow-hidden group">
                {/* Banner */}
                <div
                    className="h-48 w-full relative bg-surface-alt"
                    style={formData.bannerURL ? { backgroundImage: `url(${formData.bannerURL})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                    {!formData.bannerURL && (
                        <div className="absolute inset-0 bg-primary-gradient opacity-80" />
                    )}
                    <label className="absolute top-6 right-6 p-3 bg-overlay backdrop-blur-md rounded-2xl text-hero transition-all border border-subtle opacity-0 group-hover:opacity-100 cursor-pointer flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        <Upload className="w-3.5 h-3.5" />
                        Update Banner
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
                    </label>
                </div>

                {/* Profile Identity Section */}
                <div className="px-10 pb-10">
                    <div className="relative -mt-20 mb-6 flex justify-between items-end">
                        <div className="relative group/avatar">
                            <div className="w-40 h-40 rounded-full border-[6px] border-surface bg-surface-alt shadow-float overflow-hidden relative">
                                <img
                                    src={formData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.displayName || user?.uid}`}
                                    className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700"
                                />
                                <label className="absolute inset-0 bg-overlay flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                                    <Camera className="w-8 h-8 text-hero mb-2" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-hero">Update Photo</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="btn-primary text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center gap-2 px-8 py-3"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Sync Registry
                            </button>
                            <button
                                onClick={() => setShowConnections(true)}
                                className="btn-secondary text-xs uppercase tracking-widest flex items-center gap-2 px-8 py-3"
                            >
                                <Users className="w-4 h-4" />
                                Connections ({formData.connectionCount})
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h1 className="text-h1 text-strong">
                                    {formData.displayName || "Node_Alpha"}
                                </h1>
                                <p className="text-lg font-medium text-muted">
                                    {formData.role} • {formData.about?.split('.')[0] || "Strategic Ecosystem Node"}
                                </p>
                                <div className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center gap-1.5 text-subtle text-xs font-bold">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {formData.location || "Global Node"}
                                    </div>
                                    <div className="w-1 h-1 bg-subtle rounded-full" />
                                    <div className="text-primary text-xs font-black uppercase tracking-widest cursor-pointer hover:underline" onClick={() => setShowConnections(true)}>
                                        {formData.connectionCount} Connections
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:flex flex-col items-end gap-3 text-right">
                                <div className="flex items-center gap-2 group cursor-pointer">
                                    <div className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center border border-subtle">
                                        <GraduationCap className="w-4 h-4 text-subtle group-hover:text-primary transition-colors" />
                                    </div>
                                    <span className="text-sm font-bold text-muted">{formData.education || "University of Innovation"}</span>
                                </div>
                                <div className="flex items-center gap-2 group cursor-pointer">
                                    <div className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center border border-subtle">
                                        <Rocket className="w-4 h-4 text-subtle group-hover:text-primary transition-colors" />
                                    </div>
                                    <span className="text-sm font-bold text-muted">Founder Score: {formData.score}/100</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Rail */}
                <div className="lg:col-span-8 space-y-8">
                    <section className="card p-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-h3 text-strong">About</h3>
                            <button
                                onClick={() => handleUpdate()}
                                className="p-2 hover:bg-surface-alt dark:hover:bg-surface-alt rounded-xl transition-colors text-subtle"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea
                            value={formData.about}
                            onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                            className="w-full bg-transparent text-muted font-medium leading-relaxed outline-none resize-none"
                            placeholder="Share your strategic vision and core background..."
                            rows={4}
                        />
                    </section>

                    <section className="card p-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-h3 text-strong">Experience & Ventures</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={handleAddProject} className="p-2 bg-primary-soft text-primary rounded-xl hover:bg-primary-soft transition-all"><Plus className="w-4 h-4" /></button>
                                <button onClick={() => handleUpdate()} className="p-2 hover:bg-surface-alt dark:hover:bg-surface-alt rounded-xl transition-colors text-subtle"><Save className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="space-y-10">
                            {formData.projects.map((project, index) => (
                                <div key={index} className="flex gap-6 relative group">
                                    <div className="w-14 h-14 rounded-2xl bg-surface-alt border border-subtle flex items-center justify-center shrink-0">
                                        <Briefcase className="w-6 h-6 text-subtle" />
                                    </div>
                                    <div className="space-y-2 flex-1 pt-1">
                                        <div className="flex items-center justify-between">
                                            <input
                                                value={project.name}
                                                onChange={(e) => handleProjectChange(index, "name", e.target.value)}
                                                className="text-lg font-black bg-transparent outline-none w-full"
                                                placeholder="Venture Name"
                                            />
                                            <button onClick={() => handleRemoveProject(index)} className="opacity-0 group-hover:opacity-100 p-1.5 text-subtle hover:text-danger transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <input
                                            value={project.role}
                                            onChange={(e) => handleProjectChange(index, "role", e.target.value)}
                                            className="text-sm font-bold text-primary bg-transparent outline-none w-full"
                                            placeholder="Your Role (e.g. Founder & CEO)"
                                        />
                                        <textarea
                                            value={project.description}
                                            onChange={(e) => handleProjectChange(index, "description", e.target.value)}
                                            className="text-[13px] text-muted font-medium leading-relaxed bg-transparent outline-none w-full resize-none"
                                            placeholder="Describe your impact and mission..."
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="card p-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-h3 text-strong">Ecosystem Skills</h3>
                            <button onClick={() => handleUpdate()} className="p-2 hover:bg-surface-alt dark:hover:bg-surface-alt rounded-xl transition-colors text-subtle"><Save className="w-4 h-4" /></button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {formData.skills.split(',').map((skill, i) => skill.trim() && (
                                <div key={i} className="px-5 py-2.5 bg-surface-alt border border-subtle rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted hover:border-primary transition-all flex items-center gap-2 group cursor-default">
                                    {skill.trim()}
                                    <Star className="w-3 h-3 text-warning opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                        <input
                            value={formData.skills}
                            onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                            placeholder="Update skills (comma separated)..."
                            className="w-full pt-4 bg-transparent border-t border-subtle mt-4 outline-none text-xs text-subtle font-bold uppercase tracking-widest"
                        />
                    </section>
                </div>

                {/* Right Rail */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Public Links Card */}
                    <section className="card p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-h3 text-strong">Public Registry</h3>
                            <button onClick={() => handleUpdate()} className="p-2 hover:bg-surface-alt rounded-xl transition-colors text-subtle"><Save className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-4">

                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-surface-alt border border-subtle">
                                <Globe className="w-5 h-5 text-info" />
                                <input
                                    value={formData.socialLinks.website}
                                    onChange={(e) => handleSocialChange("website", e.target.value)}
                                    className="bg-transparent text-[11px] font-bold outline-none flex-1"
                                    placeholder="Portfolio URL"
                                />
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-surface-alt border border-subtle">
                                <ShieldCheck className="w-5 h-5 text-success" />
                                <span className="text-[10px] font-black uppercase text-subtle">Identity Secure</span>
                            </div>
                        </div>
                    </section>

                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-soft rounded-full blur-3xl opacity-40" />

                    {/* Metadata Section */}
                    <section className="card p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-h3 text-strong uppercase">Node Registry</h3>
                            <button onClick={() => handleUpdate()} className="p-1.5 bg-primary-soft text-primary rounded-lg hover:bg-primary-soft transition-all"><Save className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 flex-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-subtle pl-1">Age Identity</label>
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                                    className="input px-4 py-2.5 text-[11px] font-semibold font-mono bg-surface-alt"
                                    placeholder="N/A"
                                />
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-subtle pl-1">Venture Role</label>
                                <div className="px-4 py-3 text-[11px] font-semibold rounded-xl bg-surface-alt text-subtle border border-subtle italic truncate">
                                    {formData.role}
                                </div>
                            </div>
                        </div>
                        <InputField label="Contact Vector" icon={Phone} name="phone" placeholder="+91 00000 00000" />

                        <div className="pt-4 border-t border-subtle">
                            <button
                                onClick={handlePasswordReset}
                                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-surface-alt border border-subtle hover:bg-surface transition-all"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-subtle"><Lock className="w-3.5 h-3.5 opacity-40" /> Reset Auth Keys</span>
                                <ChevronRight className="w-3.5 h-3.5 opacity-20" />
                            </button>
                            {resetSent && <p className="mt-2 text-center text-[10px] text-primary font-bold uppercase tracking-widest">Reset Link Dispatched</p>}
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
                            className="absolute inset-0 bg-overlay backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-md modal p-8"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-h3 text-strong">Venture Partners</h3>
                                <button onClick={() => setShowConnections(false)} className="p-2 hover:bg-surface-alt dark:hover:bg-surface-alt rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-subtle" />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {connectedUsers.length > 0 ? connectedUsers.map((u) => (
                                    <div key={u.uid} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-alt border border-subtle group hover:border-primary transition-all">
                                        <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center overflow-hidden border border-subtle shadow-sm">
                                            <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.displayName || u.uid}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-strong truncate">{u.displayName}</h4>
                                            <p className="text-[10px] font-black uppercase text-primary tracking-widest truncate">{u.role || "Founder"}</p>
                                        </div>
                                        <button className="p-2 text-subtle hover:text-primary transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 space-y-4">
                                        <Users className="w-12 h-12 text-subtle dark:text-strong mx-auto" />
                                        <p className="text-xs font-bold text-subtle uppercase tracking-widest leading-relaxed"> No verified connections found <br /> in the network registry. </p>
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

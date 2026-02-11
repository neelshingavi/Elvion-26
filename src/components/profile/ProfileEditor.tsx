"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    User, Mail, Save, Phone, MapPin, GraduationCap, Briefcase,
    ShieldCheck, Lock, Loader2, Plus, Trash2, Star,
    Globe, X, ExternalLink, Users, Rocket, ChevronRight, CheckCircle2,
    Linkedin, Twitter, Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { UserData } from "@/lib/startup-service";
import { sendPasswordResetEmail, getAuth } from "firebase/auth";
import {
    getProfile,
    updateProfileData,
    subscribeToProfile
} from "@/lib/profile-service";
import { getConnectedUsers } from "@/lib/connection-service";
import { getUserData } from "@/lib/startup-service";

// Internal Components
import { ProfileBanner } from "./ProfileBanner";
import { ProfileSection } from "./ProfileSection";
import { ProfileInput, ProfileTextArea } from "./ProfileInputs";

export default function ProfileEditor() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [resetSent, setResetSent] = useState(false);

    const [connectedUsers, setConnectedUsers] = useState<UserData[]>([]);
    const [showConnections, setShowConnections] = useState(false);

    // Consolidated Profile State
    const [formData, setFormData] = useState<UserData | null>(null);
    const [activeStartup, setActiveStartup] = useState<any | null>(null);

    useEffect(() => {
        if (!user) return;

        // 1. Initial Fetch
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const profile = await getProfile(user.uid);
                if (profile) {
                    setFormData(profile);

                    // Fetch active startup if it exists
                    if (profile.activeStartupId) {
                        const { getStartup } = await import("@/lib/startup-service");
                        const startup = await getStartup(profile.activeStartupId);
                        setActiveStartup(startup);
                    }
                }

                // Fetch connections
                const ids = await getConnectedUsers(user.uid);
                const profiles = await Promise.all(ids.map(id => getUserData(id)));
                setConnectedUsers(profiles.filter(Boolean) as UserData[]);
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        // 2. Real-time sync for connection counts and dynamic fields
        const unsubscribe = subscribeToProfile(user.uid, (updatedProfile) => {
            setFormData(prev => ({
                ...prev,
                ...updatedProfile,
                // Preserve local edits for specifically defined fields if they are different?
                // Actually, standard practice is to overwrite unless focused.
                // For simplicity in this OS-like app, we'll merge.
                photoURL: updatedProfile.photoURL,
                bannerURL: updatedProfile.bannerURL,
                connectionCount: updatedProfile.connectionCount
            } as UserData));
        });

        return () => unsubscribe();
    }, [user]);

    const handleSave = async (sectionId: string, dataToSave?: Partial<UserData>) => {
        if (!user || !formData) return;

        setSaving(sectionId);
        try {
            if (sectionId === 'startup' && activeStartup) {
                const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase");
                const startupRef = doc(db, "startups", activeStartup.startupId);
                await updateDoc(startupRef, {
                    name: activeStartup.name,
                    industry: activeStartup.industry,
                    oneSentencePitch: activeStartup.oneSentencePitch,
                    updatedAt: serverTimestamp()
                });
            } else {
                // If dataToSave is provided, use it (for nested updates), otherwise use current formData
                const finalData = dataToSave || formData;

                // Clean up skills if it's coming from a string input (backward compatibility)
                let skills = finalData.skills;
                if (typeof skills === 'string') {
                    skills = (skills as string).split(',').map(s => s.trim()).filter(Boolean);
                }

                await updateProfileData(user.uid, {
                    ...finalData,
                    skills
                });
            }

            setSuccess(sectionId);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error(`Save failed for ${sectionId}:`, err);
            alert("Failed to save changes. Please check your connection.");
        } finally {
            setSaving(null);
        }
    };

    const updateField = (field: keyof UserData | string, value: any) => {
        setFormData(prev => {
            if (!prev) return null;
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                return {
                    ...prev,
                    [parent]: { ...(prev as any)[parent], [child]: value }
                };
            }
            return { ...prev, [field]: value };
        });
    };

    const handleAddProject = () => {
        if (!formData) return;
        const newProjects = [...(formData.projects || []), { name: "", description: "", role: "", link: "" }];
        updateField('projects', newProjects);
    };

    const handleRemoveProject = (index: number) => {
        if (!formData) return;
        const newProjects = formData.projects?.filter((_, i) => i !== index);
        updateField('projects', newProjects);
    };

    const handleProjectChange = (index: number, field: string, value: string) => {
        if (!formData || !formData.projects) return;
        const newProjects = [...formData.projects];
        (newProjects[index] as any)[field] = value;
        updateField('projects', newProjects);
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
            setResetSent(false);
            alert("Could not send reset email.");
        }
    };

    if (loading && !formData) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest text-subtle">Syncing with Registry...</p>
            </div>
        );
    }

    if (!formData) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 lg:px-0">
            {/* Header / Banner Card */}
            <div className="card overflow-hidden group">
                <ProfileBanner
                    uid={formData.uid}
                    bannerURL={formData.bannerURL}
                    photoURL={formData.photoURL}
                    displayName={formData.displayName}
                    onUpdate={(field, url) => updateField(field, url)}
                />

                <div className="px-10 pb-10">
                    <div className="flex justify-between items-end mb-8">
                        {/* Placeholder for spacer - Avatar is absolute */}
                        <div className="w-40 h-20" />

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleSave('header')}
                                disabled={!!saving}
                                className="btn-primary text-[10px] py-3 px-8 uppercase tracking-widest flex items-center gap-2"
                            >
                                {saving === 'header' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                {success === 'header' ? "Verified" : "Sync Profile"}
                            </button>
                            <button
                                onClick={() => setShowConnections(true)}
                                className="btn-secondary text-[10px] py-3 px-8 uppercase tracking-widest flex items-center gap-2"
                            >
                                <Users className="w-4 h-4" />
                                Network ({formData.connectionCount || 0})
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <h1 className="text-h1 text-strong flex items-center gap-3">
                                {formData.displayName || "Node_Alpha"}
                                {formData.isOnboardingCompleted && <CheckCircle2 className="w-5 h-5 text-success" />}
                            </h1>
                            <p className="text-lg font-medium text-muted">
                                {formData.role === 'admin' ? "System Administrator" : "Venture Founder"} • {formData.location || "Remote Node"}
                            </p>
                            <div className="flex items-center gap-4 pt-2">
                                <span className="text-xs font-bold text-subtle flex items-center gap-1.5 grayscale opacity-70">
                                    <Mail className="w-3.5 h-3.5" /> {formData.email}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end justify-center text-right space-y-3">
                            <div className="px-4 py-2 rounded-2xl bg-surface-alt border border-subtle flex items-center gap-3">
                                <Rocket className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold text-strong">Founder Score: {formData.score || 0}/100</span>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-subtle">
                                Level: {formData.score && formData.score > 80 ? 'Master Architect' : formData.score && formData.score > 50 ? 'Rising Founder' : 'Early Innovator'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Rail */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Basic Info */}
                    <ProfileSection
                        title="Identity & Bio"
                        description="Professional background and strategic objectives."
                        onSave={() => handleSave('bio')}
                        saving={saving === 'bio'}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProfileInput
                                label="Display Name"
                                icon={User}
                                value={formData.displayName || ""}
                                onChange={(v) => updateField('displayName', v)}
                            />
                            <ProfileInput
                                label="Location"
                                icon={MapPin}
                                value={formData.location || ""}
                                onChange={(v) => updateField('location', v)}
                            />
                        </div>
                        <ProfileTextArea
                            label="Strategic Briefing (About)"
                            value={formData.about || ""}
                            onChange={(v) => updateField('about', v)}
                            placeholder="Describe your journey, core mission, and what you're building..."
                            maxLength={500}
                        />
                    </ProfileSection>

                    {/* Active Startup Info */}
                    {activeStartup && (
                        <ProfileSection
                            title="Primary Venture"
                            description="Details of your current active startup context."
                            onSave={() => handleSave('startup')}
                            saving={saving === 'startup'}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ProfileInput
                                    label="Startup Name"
                                    icon={Rocket}
                                    value={activeStartup.name || ""}
                                    onChange={(v) => setActiveStartup({ ...activeStartup, name: v })}
                                />
                                <ProfileInput
                                    label="Industry Path"
                                    icon={Target}
                                    value={activeStartup.industry || ""}
                                    onChange={(v) => setActiveStartup({ ...activeStartup, industry: v })}
                                />
                            </div>
                            <ProfileTextArea
                                label="The One-Sentence Pitch"
                                value={activeStartup.oneSentencePitch || ""}
                                onChange={(v) => setActiveStartup({ ...activeStartup, oneSentencePitch: v })}
                                placeholder="We help [X] to [Y] by doing [Z]..."
                                rows={2}
                            />
                        </ProfileSection>
                    )}

                    {/* Skills */}
                    <ProfileSection
                        title="Ecosystem Capabilities"
                        description="Technical and strategic skill sets indexed in the network."
                        onSave={() => handleSave('skills')}
                        saving={saving === 'skills'}
                    >
                        <div className="flex flex-wrap gap-2 mb-4">
                            {(Array.isArray(formData.skills) ? formData.skills : (formData.skills as unknown as string || "").split(',').filter(Boolean)).map((skill, i) => (
                                <div key={i} className="px-4 py-2 bg-primary-soft border border-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 group">
                                    {skill.trim()}
                                    <Star className="w-3 h-3 text-warning fill-warning opacity-50" />
                                </div>
                            ))}
                        </div>
                        <ProfileInput
                            label="Add Skills (Comma Separated)"
                            icon={Plus}
                            value={Array.isArray(formData.skills) ? formData.skills.join(', ') : (formData.skills || "")}
                            onChange={(v) => updateField('skills', v)}
                            placeholder="AI, Product, Growth, React..."
                        />
                    </ProfileSection>

                    {/* Ventures & Experience */}
                    <ProfileSection
                        title="Active Ventures & History"
                        description="Key projects and prior entrepreneurial milestones."
                        onSave={() => handleSave('projects')}
                        saving={saving === 'projects'}
                        actions={
                            <button
                                onClick={handleAddProject}
                                className="p-2 bg-primary-soft text-primary rounded-xl hover:scale-110 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        }
                    >
                        <div className="space-y-10">
                            {(!formData.projects || formData.projects.length === 0) && (
                                <div className="text-center py-12 border-2 border-dashed border-subtle rounded-3xl">
                                    <Briefcase className="w-10 h-10 text-subtle mx-auto mb-3 opacity-20" />
                                    <p className="text-xs font-bold text-subtle uppercase tracking-widest">No ventures listed yet.</p>
                                    <button onClick={handleAddProject} className="text-primary text-[10px] font-black uppercase tracking-widest mt-2 hover:underline">Add First Venture</button>
                                </div>
                            )}

                            {formData.projects?.map((project, index) => (
                                <div key={index} className="flex gap-6 relative group animate-in slide-in-from-left-4 duration-300">
                                    <div className="w-16 h-16 rounded-2xl bg-surface-alt border border-subtle flex items-center justify-center shrink-0 shadow-sm">
                                        <Rocket className="w-7 h-7 text-primary/40" />
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <input
                                                    value={project.name}
                                                    onChange={(e) => handleProjectChange(index, "name", e.target.value)}
                                                    className="text-xl font-black bg-transparent outline-none w-full text-strong placeholder:text-subtle"
                                                    placeholder="Startup / Project Name"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleRemoveProject(index)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-subtle hover:text-danger hover:bg-danger-soft rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <ProfileInput
                                                label="Role"
                                                value={project.role}
                                                onChange={(v) => handleProjectChange(index, "role", v)}
                                                placeholder="e.g. Founder"
                                            />
                                            <ProfileInput
                                                label="URL (Optional)"
                                                value={project.link}
                                                onChange={(v) => handleProjectChange(index, "link", v)}
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <ProfileTextArea
                                            label="Impact Summary"
                                            value={project.description}
                                            onChange={(v) => handleProjectChange(index, "description", v)}
                                            placeholder="What problem did you solve and what was the outcome?"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ProfileSection>
                </div>

                {/* Sidebar Rail */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Public Registry / Social */}
                    <ProfileSection
                        title="Public Registry"
                        onSave={() => handleSave('social')}
                        saving={saving === 'social'}
                    >
                        <div className="space-y-4">
                            <ProfileInput
                                label="LinkedIn"
                                icon={Linkedin}
                                value={formData.socialLinks?.linkedin || ""}
                                onChange={(v) => updateField('socialLinks.linkedin', v)}
                                placeholder="linkedin.com/in/..."
                            />
                            <ProfileInput
                                label="Twitter / X"
                                icon={Twitter}
                                value={formData.socialLinks?.twitter || ""}
                                onChange={(v) => updateField('socialLinks.twitter', v)}
                                placeholder="@username"
                            />
                            <ProfileInput
                                label="Registry Website"
                                icon={Globe}
                                value={formData.socialLinks?.website || ""}
                                onChange={(v) => updateField('socialLinks.website', v)}
                                placeholder="https://..."
                            />
                        </div>
                    </ProfileSection>

                    {/* Metadata & Status */}
                    <ProfileSection
                        title="Node Metadata"
                        onSave={() => handleSave('metadata')}
                        saving={saving === 'metadata'}
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <ProfileInput
                                label="Age Identity"
                                type="number"
                                value={formData.age || ""}
                                onChange={(v) => updateField('age', v)}
                                placeholder="N/A"
                            />
                            <div className="space-y-1.5 flex-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-subtle pl-1">Venture Role</label>
                                <div className="px-4 py-3 text-[11px] font-semibold rounded-xl bg-surface-alt text-subtle border border-subtle italic truncate">
                                    {formData.role || "Founder"}
                                </div>
                            </div>
                        </div>
                        <ProfileInput
                            label="Phone Vector"
                            icon={Phone}
                            value={formData.phone || ""}
                            onChange={(v) => updateField('phone', v)}
                            placeholder="+91..."
                        />
                        <ProfileInput
                            label="Education"
                            icon={GraduationCap}
                            value={formData.education || ""}
                            onChange={(v) => updateField('education', v)}
                            placeholder="University / Self-taught"
                        />
                    </ProfileSection>

                    {/* Account Security */}
                    <ProfileSection title="Security & Auth">
                        <div className="space-y-4">
                            <button
                                onClick={handlePasswordReset}
                                disabled={resetSent}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-alt border border-subtle hover:bg-surface hover:border-primary transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-surface border border-subtle group-hover:text-primary transition-colors">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-subtle">Reset Access Keys</span>
                                </div>
                                <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>
                            {resetSent && (
                                <div className="p-3 bg-success-soft border border-success/20 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-success animate-in fade-in zoom-in-95">
                                    <Mail className="w-3.5 h-3.5" /> Reset Dispatch successful.
                                </div>
                            )}
                        </div>
                    </ProfileSection>
                </div>
            </div>

            {/* Connections Overlay */}
            <AnimatePresence>
                {showConnections && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConnections(false)}
                            className="absolute inset-0 bg-overlay/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg card p-0 overflow-hidden shadow-float"
                        >
                            <div className="p-8 border-b border-subtle bg-surface-alt flex items-center justify-between">
                                <div>
                                    <h3 className="text-h3 text-strong">Venture Network</h3>
                                    <p className="text-caption">Verified connections in your ecosystem.</p>
                                </div>
                                <button onClick={() => setShowConnections(false)} className="p-2 hover:bg-surface rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-subtle" />
                                </button>
                            </div>

                            <div className="p-8 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                                {connectedUsers.length > 0 ? connectedUsers.map((u) => (
                                    <div key={u.uid} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-alt border border-subtle group hover:border-primary transition-all">
                                        <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center overflow-hidden border border-subtle shadow-sm">
                                            <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.displayName || u.uid}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-strong truncate">{u.displayName}</h4>
                                            <p className="text-[10px] font-black uppercase text-primary tracking-widest truncate">{u.role || "Founder"}</p>
                                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-subtle">
                                                <MapPin className="w-3 h-3" /> {u.location || "Earth Node"}
                                            </div>
                                        </div>
                                        <button className="p-3 bg-surface border border-subtle rounded-xl text-subtle hover:text-primary hover:border-primary transition-all">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="text-center py-20 space-y-4">
                                        <div className="w-20 h-20 bg-surface-alt rounded-full flex items-center justify-center mx-auto border border-subtle border-dashed">
                                            <Users className="w-10 h-10 text-subtle opacity-30" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-strong uppercase tracking-[0.1em]">No Verified Connections</p>
                                            <p className="text-xs text-subtle font-medium">Your network registry is currently empty.</p>
                                        </div>
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

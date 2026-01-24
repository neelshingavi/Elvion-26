"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, sendPasswordResetEmail, getAuth } from "firebase/auth";
import { User, Mail, Save, Phone, MapPin, GraduationCap, Briefcase, Award, Clock, ShieldCheck, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfileEditor() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    // Profile Data
    const [formData, setFormData] = useState({
        displayName: "",
        email: "",
        about: "",
        skills: "",
        age: "",
        phone: "",
        education: "",
        location: ""
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
                    location: data.location || ""
                });
            }
        };
        fetchProfile();
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
                location: formData.location
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
                    </div>
                </div>
            </form>
        </div>
    );
}

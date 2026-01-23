"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createJobSeekerProfile } from "@/lib/job-seeker-service";
import { ChevronRight, Check } from "lucide-react";

export default function JobSeekerOnboarding() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        displayName: "",
        tagline: "",
        about: "",
        skills: [] as any[], // Simplified for now
        preferences: {
            roles: [] as string[],
            stages: [] as string[],
            remote: true,
            salaryRange: { min: 0, max: 0 }
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            await createJobSeekerProfile(user.uid, {
                displayName: formData.displayName,
                tagline: formData.tagline,
                about: formData.about,
                email: user.email!,  // Force non-null assertion as auth guarantees email usually
                preferences: formData.preferences,
                // Add mock skills for now
                skills: [
                    { id: "1", name: "React", level: "expert", years: 4 },
                    { id: "2", name: "TypeScript", level: "intermediate", years: 2 }
                ]
            });
            router.push("/job-seeker/dashboard");
        } catch (error) {
            console.error("Onboarding failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-12">
            <div className="mb-8 text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold tracking-widest uppercase text-zinc-500">
                    Step {step} of 2
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Complete your profile</h1>
                <p className="text-zinc-500">Let's find you the perfect startup match.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div>
                            <label className="block text-sm font-bold mb-2">Full Name</label>
                            <input
                                type="text"
                                required
                                value={formData.displayName}
                                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                                placeholder="e.g. Jane Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">Professional Tagline</label>
                            <input
                                type="text"
                                required
                                value={formData.tagline}
                                onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                                placeholder="e.g. Senior Frontend Engineer specializing in UX"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">About You</label>
                            <textarea
                                required
                                value={formData.about}
                                onChange={e => setFormData({ ...formData, about: e.target.value })}
                                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-32 resize-none"
                                placeholder="Briefly describe your background and what you're looking for..."
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            disabled={!formData.displayName || !formData.tagline}
                            className="w-full py-4 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            Next Step
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <h3 className="font-bold mb-2">Skills & Preferences</h3>
                            <p className="text-sm text-zinc-500 mb-4">
                                (Simulated) We've auto-detected your skills from your GitHub profile and set your default preferences.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-black text-white dark:bg-white dark:text-black rounded text-xs font-bold">React</span>
                                <span className="px-2 py-1 bg-black text-white dark:bg-white dark:text-black rounded text-xs font-bold">TypeScript</span>
                                <span className="px-2 py-1 bg-black text-white dark:bg-white dark:text-black rounded text-xs font-bold">Remote</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? "Creating Profile..." : (
                                <>
                                    Complete Profile
                                    <Check className="w-4 h-4" />
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full py-2 text-sm font-bold text-zinc-500 hover:text-black dark:hover:text-white"
                        >
                            Back
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

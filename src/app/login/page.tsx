"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    signInWithPopup,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isConfigValid } from "@/lib/firebase";
import { Loader2, AlertCircle, Eye, EyeOff, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<"login" | "signup">("login");

    // Form State
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const handleGoogleLogin = async () => {
        if (!isConfigValid) {
            setError("Firebase configuration is missing.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            // Ensure user document exists (handled in onboarding, but good to ensure)
            await setDoc(doc(db, "users", result.user.uid), {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                role: "founder",
                lastLogin: serverTimestamp(),
            }, { merge: true });

            router.push("/onboarding");
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Failed to sign in.");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isConfigValid) {
            setError("Firebase configuration is missing.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (mode === "signup") {
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                await updateProfile(userCredential.user, {
                    displayName: formData.name
                });

                // Create user document
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    uid: userCredential.user.uid,
                    email: formData.email,
                    displayName: formData.name,
                    role: "founder",
                    createdAt: serverTimestamp(),
                });

                router.push("/onboarding");
            } else {
                await signInWithEmailAndPassword(auth, formData.email, formData.password);
                router.push("/onboarding");
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            let msg = "Authentication failed.";
            if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
            if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
            if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] p-4 md:p-6 lg:p-8 font-sans">
            {/* Background Decorative Elements - Soft Light Gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] rounded-full bg-indigo-50/50 blur-[100px]" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-purple-50/50 blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-4xl grid lg:grid-cols-2 bg-white rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-neutral-200/60 relative z-10"
            >
                {/* Left Panel - Image Section */}
                <div className="hidden lg:block relative h-full min-h-[500px] overflow-hidden border-r border-neutral-100 bg-neutral-50">
                    <Image
                        src="/auth-image.jpg"
                        alt="Join FounderFlow"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Right Panel - Auth Form Section */}
                <div className="flex flex-col p-8 md:p-10 lg:p-12 bg-white justify-center">
                    <div className="mb-auto">
                        <div className="flex items-center justify-between mb-12 lg:hidden">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                                    <span className="text-sm font-black text-white">F</span>
                                </div>
                                <span className="text-xl font-bold tracking-tighter text-black">
                                    Founder<span className="text-indigo-600">Flow</span>
                                </span>
                            </Link>
                        </div>

                        <div className="space-y-1 mb-8">
                            <motion.h2
                                layout
                                className="text-2xl font-bold tracking-tight text-neutral-900"
                            >
                                {mode === 'login' ? 'Sign In' : 'Create Account'}
                            </motion.h2>
                            <p className="text-neutral-500 text-sm">
                                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    onClick={() => {
                                        setMode(mode === 'login' ? 'signup' : 'login');
                                        setError(null);
                                        setFormData({ name: "", email: "", password: "" });
                                    }}
                                    className="font-semibold text-indigo-600 hover:text-indigo-700 transition-all"
                                >
                                    {mode === 'login' ? "Sign up" : "Sign in"}
                                </button>
                            </p>
                        </div>

                        {!isConfigValid && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 mb-6">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="text-xs font-medium">System Error: Firebase configuration is missing.</p>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, y: -10 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: -10 }}
                                    className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-center gap-3 mb-6 overflow-hidden"
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span className="flex-1">{error}</span>
                                    <button onClick={() => setError(null)} className="hover:text-red-800 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleEmailAuth} className="space-y-5">
                            <AnimatePresence mode="popLayout">
                                {mode === 'signup' && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="space-y-3"
                                    >
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 ml-1">Full Name</label>
                                        <div className="relative group">
                                            <input
                                                required
                                                type="text"
                                                placeholder="e.g. Alexander Hamilton"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-neutral-400 text-sm"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 ml-1">Email Address</label>
                                <div className="relative group">
                                    <input
                                        required
                                        type="email"
                                        placeholder="founder@startup.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-neutral-400 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pb-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 ml-1">Password</label>
                                <div className="relative group">
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-neutral-400 text-sm pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                type="submit"
                                disabled={loading || !isConfigValid}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none mt-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span>{mode === 'login' ? "Sign In" : "Get Started"}</span>
                                )}
                            </motion.button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-neutral-100" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-neutral-300">
                                <span className="bg-white px-3">secure</span>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01, backgroundColor: '#f9fafb' }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleGoogleLogin}
                            disabled={loading || !isConfigValid}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-neutral-200 text-neutral-700 px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 shadow-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span className="text-sm">Sign in with Google</span>
                        </motion.button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest leading-loose">
                            By joining, you agree to our <br />
                            <button className="text-neutral-500 hover:text-indigo-600 transition-colors">Terms of Service</button> & <button className="text-neutral-500 hover:text-indigo-600 transition-colors">Privacy Policy</button>.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );

}

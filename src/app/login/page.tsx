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
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isConfigValid } from "@/lib/firebase";
import { Loader2, AlertCircle, Eye, EyeOff, X } from "lucide-react";
import Link from "next/link";
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

            const userRef = doc(db, "users", result.user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // First time OAuth login -> Treat as SIGNUP
                await setDoc(userRef, {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    role: "founder",
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    isOnboardingCompleted: false
                });
                router.push("/onboarding");
            } else {
                // Existing user -> LOGIN
                await updateDoc(userRef, {
                    lastLogin: serverTimestamp()
                });

                const userData = userSnap.data();
                if (userData?.isOnboardingCompleted || userData?.activeStartupId) {
                    router.push("/founder/dashboard");
                } else {
                    router.push("/onboarding");
                }
            }
        } catch (err: any) {
            if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                console.warn("Login cancelled by user.");
                setError("Sign-in process was cancelled.");
            } else {
                console.error("Login error:", err);
                setError(err.message || "Failed to sign in.");
            }
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
                    isOnboardingCompleted: false
                });

                router.push("/onboarding");
            } else {
                const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);

                // Check onboarding status
                const userRef = doc(db, "users", userCredential.user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists() && (userSnap.data()?.isOnboardingCompleted || userSnap.data()?.activeStartupId)) {
                    router.push("/founder/dashboard");
                } else {
                    router.push("/onboarding");
                }
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
        <div className="min-h-screen grid lg:grid-cols-2 bg-neutral-950 text-white selection:bg-indigo-500/30">
            {/* Left Panel - Visuals */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-neutral-900/50 border-r border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[100px]" />
                </div>

                <div className="relative z-10">
                    <Link href="/" className="text-2xl font-bold tracking-tighter">
                        Founder<span className="text-indigo-500">Flow</span>
                    </Link>
                </div>

                <div className="relative z-10 space-y-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h1 className="text-4xl font-bold tracking-tight mb-4">
                                {mode === 'login' ? "Welcome back, founder." : "Start your journey."}
                            </h1>
                            <p className="text-lg text-neutral-400 max-w-md">
                                {mode === 'login'
                                    ? "Continue building your startup with AI-powered tools and validated roadmaps."
                                    : "Join thousands of founders simplifying their workflow and scaling faster."
                                }
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="relative z-10 text-sm text-neutral-500">
                    © {new Date().getFullYear()} FounderFlow Inc.
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="flex items-center justify-center p-8 relative">
                <div className="absolute top-8 right-8 lg:hidden">
                    <Link href="/" className="text-xl font-bold tracking-tighter">
                        Founder<span className="text-indigo-500">Flow</span>
                    </Link>
                </div>

                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="text-2xl font-bold tracking-tight">
                            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
                        </h2>
                        <p className="mt-2 text-sm text-neutral-400">
                            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => {
                                    setMode(mode === 'login' ? 'signup' : 'login');
                                    setError(null);
                                    setFormData({ name: "", email: "", password: "" });
                                }}
                                className="font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
                            >
                                {mode === 'login' ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    </div>

                    {!isConfigValid && (
                        <div className="p-4 rounded-xl bg-red-900/20 border border-red-900/50 text-red-400 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm">
                                System Error: Firebase config missing.
                            </p>
                        </div>
                    )}

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 rounded-xl bg-red-900/20 border border-red-900/50 text-red-400 text-sm flex items-center gap-2 overflow-hidden"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                                <button onClick={() => setError(null)} className="ml-auto hover:text-white"><X className="w-4 h-4" /></button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {mode === 'signup' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 overflow-hidden"
                                >
                                    <label className="text-xs font-bold uppercase text-neutral-500">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Elon Musk"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-600"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-neutral-500">Email Address</label>
                            <input
                                required
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-neutral-500">Password</label>
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-600 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !isConfigValid}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-indigo-900/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (mode === 'login' ? "Sign In" : "Create Account")}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-neutral-950 px-2 text-neutral-500">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading || !isConfigValid}
                        className="group relative w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-neutral-200 px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Google
                    </button>
                    <p className="text-center text-xs text-neutral-600">
                        By clicking continue, you agree to our Terms of Service.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, isConfigValid } from "@/lib/firebase";
import { Loader2, AlertCircle, Eye, EyeOff, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Scene from "@/components/landing/Scene";

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
          accountStatus: "active",
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          isOnboardingCompleted: false,
        });
        router.push("/onboarding");
      } else {
        // Existing user -> LOGIN
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
        });

        const userData = userSnap.data();
        if (userData?.isOnboardingCompleted || userData?.activeStartupId) {
          router.push("/founder/dashboard");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err: any) {
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
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
        if (formData.password.length < 6) {
          setError("Password should be at least 6 characters.");
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );
        await updateProfile(userCredential.user, {
          displayName: formData.name,
        });

        // Create user document
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: formData.email,
          displayName: formData.name,
          role: "founder",
          accountStatus: "active",
          createdAt: serverTimestamp(),
          isOnboardingCompleted: false,
        });

        router.push("/onboarding");
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );

        // Check onboarding status
        const userRef = doc(db, "users", userCredential.user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          await updateDoc(userRef, { lastLoginAt: serverTimestamp() });

          const userData = userSnap.data();
          if (userData?.isOnboardingCompleted || userData?.activeStartupId) {
            router.push("/founder/dashboard");
          } else {
            router.push("/onboarding");
          }
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = "Authentication failed.";
      if (err.code === "auth/email-already-in-use") msg = "Email already in use.";
      if (err.code === "auth/invalid-credential") msg = "Invalid email or password.";
      if (err.code === "auth/weak-password") msg = "Password should be at least 6 characters.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      {/* 3D Scene Background - Shared with Landing Page */}
      <Scene />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl bg-black/40 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2 relative z-10"
      >
        {/* Left Panel - Image (No Text) */}
        <div className="hidden md:block relative h-full">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/auth-image.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        </div>

        {/* Right Panel - Form */}
        <div className="p-6 md:p-10 flex flex-col justify-center relative bg-black/20">
          <div className="absolute top-4 right-4">
            <Link href="/" className="p-2 rounded-full hover:bg-white/5 transition-colors text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </Link>
          </div>

          <div className="mb-6 text-center md:text-left">
            <Link href="/" className="inline-block text-2xl font-black tracking-tighter mb-4">
              Founder<span className="text-indigo-500">Flow</span>
            </Link>

            <h2 className="text-2xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-500">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-zinc-400 text-xs">
              {mode === "login"
                ? "Enter your details to access your workspace."
                : "Join the operating system for modern founders."}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Config Error */}
          {!isConfigValid && (
            <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              System Error: Firebase config missing.
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <AnimatePresence mode="popLayout">
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Elon Musk"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Email Address</label>
              <input
                required
                type="email"
                placeholder="founder@startup.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-indigo-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isConfigValid}
              className="w-full bg-indigo-600 border border-indigo-500 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 text-sm shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-transparent px-2 text-zinc-600">Secure Authentication</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading || !isConfigValid}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="mt-4 text-center">
            <p className="text-zinc-500 text-[10px] md:text-xs">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(null);
                  setFormData({ name: "", email: "", password: "" });
                }}
                className="ml-2 text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

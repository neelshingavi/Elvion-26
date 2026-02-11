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

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const redirectUser = (userData: any) => {
    if (userData?.isOnboardingCompleted || userData?.activeStartupId) {
      router.push("/founder/dashboard");
    } else {
      router.push("/onboarding");
    }
  };

  /* ---------------- GOOGLE AUTH ---------------- */
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
        await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
        redirectUser(userSnap.data());
      }
    } catch (err: any) {
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        setError("Sign-in process was cancelled.");
      } else {
        console.error(err);
        setError("Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- EMAIL AUTH ---------------- */
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

        const cred = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        await updateProfile(cred.user, { displayName: formData.name });

        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          email: formData.email,
          displayName: formData.name,
          role: "founder",
          accountStatus: "active",
          createdAt: serverTimestamp(),
          isOnboardingCompleted: false,
        });

        router.push("/onboarding");
      } else {
        const cred = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const userRef = doc(db, "users", cred.user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
          redirectUser(snap.data());
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Authentication failed.";
      if (err.code === "auth/email-already-in-use") msg = "Email already in use.";
      if (err.code === "auth/invalid-credential") msg = "Invalid email or password.";
      if (err.code === "auth/weak-password") msg = "Password should be at least 6 characters.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      <Scene />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl bg-black/40 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2 relative z-10"
      >
        {/* Left Panel - Illustration */}
        <div className="hidden md:block relative h-full bg-white">
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat p-12"
            style={{ backgroundImage: "url('/auth-v3.jpg')" }}
          />
          {/* Subtle overlay to soften the white if needed */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5 pointer-events-none" />
        </div>

        {/* Right Panel - Form */}
        <div className="p-6 md:p-10 flex flex-col justify-center relative">
          <Link href="/" className="absolute top-4 right-4 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </Link>

          <h2 className="text-2xl font-bold mb-2">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            {mode === "login"
              ? "Sign in to access your workspace."
              : "Join the operating system for founders."}
          </p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <input
                required
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input"
              />
            )}

            <input
              required
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="input"
            />

            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="my-6 text-center text-xs text-zinc-500">
            OR
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn-secondary w-full"
          >
            Continue with Google
          </button>

          <p className="mt-4 text-center text-xs text-zinc-500">
            {mode === "login" ? "No account?" : "Already have an account?"}
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="ml-2 text-indigo-400 font-semibold"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

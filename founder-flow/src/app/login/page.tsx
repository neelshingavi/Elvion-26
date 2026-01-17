"use client";

import React from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { LogIn, Rocket } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push("/onboarding");
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] dark:bg-[#050505] p-4 font-sans">
            <div className="w-full max-w-md space-y-8 bg-white dark:bg-[#0a0a0a] p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-3 bg-black dark:bg-white rounded-xl mb-4">
                        <Rocket className="w-8 h-8 text-white dark:text-black" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Welcome to FounderFlow
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        The agentic hub for your startup journey.
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleGoogleLogin}
                        className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-50 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                    >
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/bx_loader.gif"
                            alt="Google"
                            className="w-5 h-5 hidden group-active:block"
                        />
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
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-200 dark:border-zinc-800"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#fafafa] dark:bg-[#050505] px-2 text-zinc-500">
                            Or continue with
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <input
                        type="email"
                        placeholder="name@company.com"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    />
                    <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-black dark:bg-zinc-50 px-4 py-3 text-sm font-medium text-white dark:text-black transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200">
                        <LogIn className="w-4 h-4" />
                        Sign in with Email
                    </button>
                </div>

                <p className="text-center text-xs text-zinc-500 mt-6">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}

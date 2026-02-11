"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Rocket,
    Sparkles,
    AlertCircle,
    MessageSquare,
    Send,
    CheckCircle2,
    ChevronRight,
    User,
    Target,
    Zap,
    Clock,
    MapPin
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { createStartup } from "@/lib/startup-service";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Indian demographic segments for targeting
const INDIAN_DEMOGRAPHICS = [
    { value: "tier1_metro", label: "Tier 1 Metro Cities", description: "Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad" },
    { value: "tier2_emerging", label: "Tier 2 Emerging Cities", description: "Pune, Ahmedabad, Jaipur, Lucknow, Kochi" },
    { value: "tier3_aspirational", label: "Tier 3 Aspirational", description: "Smaller cities with growing digital presence" },
    { value: "rural_digital", label: "Rural Digital India", description: "Bharat market with mobile-first users" },
    { value: "nri_returnee", label: "NRI Returnees", description: "Non-resident Indians returning to build" },
    { value: "student_founder", label: "Student Founders", description: "College/university ecosystem" },
    { value: "corporate_spinout", label: "Corporate Professionals", description: "Founders from corporate backgrounds" },
    { value: "serial_entrepreneur", label: "Serial Entrepreneurs", description: "Experienced repeat founders" }
];

// Industries optimized for Indian market
const INDUSTRIES = [
    "SaaS / B2B Software",
    "Consumer App / B2C",
    "Fintech / Payments",
    "HealthTech / Wellness",
    "E-commerce / D2C",
    "EdTech / Upskilling",
    "Artificial Intelligence",
    "AgriTech",
    "GreenTech / CleanTech",
    "Web3 / Blockchain",
    "Logistics / Supply Chain",
    "PropTech / Real Estate",
    "Media / Entertainment",
    "Other"
];

// AI Interview Questions for founder intake
const INTERVIEW_QUESTIONS = [
    {
        id: "background",
        question: "Tell me about your background. What's your professional journey been like?",
        placeholder: "I've been working in...",
        minLength: 50,
        aiFollowUp: true
    },
    {
        id: "experience",
        question: "Have you started anything before? What did you learn from it?",
        placeholder: "This is my first venture... / Previously, I built...",
        minLength: 30,
        aiFollowUp: true
    },
    {
        id: "risk",
        question: "How would you describe your risk appetite? Are you going all-in, or building on the side?",
        placeholder: "I'm comfortable with...",
        minLength: 20,
        aiFollowUp: false
    },
    {
        id: "vision",
        question: "Fast forward 5 years. What does success look like for this venture?",
        placeholder: "In 5 years, I see...",
        minLength: 50,
        aiFollowUp: true
    }
];

type OnboardingStep = "init" | "project" | "interview" | "first48" | "complete";

interface FormData {
    name: string;
    oneSentencePitch: string;
    targetDemographic: string;
    industry: string;
    problemStatement: string;
    vision: string;
}

interface InterviewAnswers {
    background: string;
    experience: string;
    risk: string;
    vision: string;
}

interface First48Task {
    id: string;
    title: string;
    description: string;
    assumption: string;
    timeHours: number;
    priority: "high" | "medium" | "low";
}

export default function OnboardingPage() {
    const { user, userData, loading: authLoading } = useAuth();
    const router = useRouter();

    // States
    const [step, setStep] = useState<OnboardingStep>("init");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(true);

    // Form Data
    const [formData, setFormData] = useState<FormData>({
        name: "",
        oneSentencePitch: "",
        targetDemographic: "",
        industry: "",
        problemStatement: "",
        vision: ""
    });

    // Interview State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [interviewAnswers, setInterviewAnswers] = useState<InterviewAnswers>({
        background: "",
        experience: "",
        risk: "",
        vision: ""
    });
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null);
    const [aiTyping, setAiTyping] = useState(false);
    const [aiResponse, setAiResponse] = useState("");

    // First 48 Hours Plan
    const [first48Tasks, setFirst48Tasks] = useState<First48Task[]>([]);
    const [generatingPlan, setGeneratingPlan] = useState(false);

    // Startup ID for final creation
    const [createdStartupId, setCreatedStartupId] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Timeout helper
    const withTimeout = <T,>(promise: Promise<T>, ms: number = 15000, errorMessage: string = "Request timed out"): Promise<T> => {
        const timeout = new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), ms)
        );
        return Promise.race([promise, timeout]);
    };

    // Redirect if onboarding already completed (but allow 'complete' step to show celebration)
    useEffect(() => {
        if (!authLoading && userData?.isOnboardingCompleted && step !== 'complete') {
            router.push("/founder/dashboard");
        }
    }, [userData, authLoading, router, step]);

    // Initialize founder role on mount
    useEffect(() => {
        const initializeFounderRole = async () => {
            if (authLoading || !user) return;

            // If completed, let the other effect handle redirect
            if (userData?.isOnboardingCompleted) return;

            try {
                // Determine step based on existing data if partial
                // "Partial onboarding data exists -> Resume from last step"

                await withTimeout(
                    setDoc(doc(db, "users", user.uid), {
                        uid: user.uid,
                        role: "founder",
                        // Don't overwrite createdAt
                    }, { merge: true }),
                    10000,
                    "Network request timed out."
                );

                setInitializing(false);

                // Smart Resume Logic
                if (userData?.founderIntake?.interviewCompletedAt) {
                    // If interview done but not full onboarding
                    setStep("first48");
                } else {
                    setStep("project");
                }

            } catch (err: any) {
                console.error("Error setting founder role:", err);
                setError(err.message || "Failed to initialize. Please try again.");
                setInitializing(false);
            }
        };

        initializeFounderRole();
    }, [user, authLoading, userData]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentQuestionIndex, aiResponse]);

    // Handle project form submission
    const handleProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Validation
        if (!formData.name.trim()) {
            setError("Startup name is required");
            return;
        }
        if (!formData.oneSentencePitch.trim()) {
            setError("One-sentence pitch is required");
            return;
        }
        if (!formData.targetDemographic) {
            setError("Target demographic is required");
            return;
        }
        if (!formData.industry) {
            setError("Industry selection is required");
            return;
        }

        setError(null);
        setStep("interview");
        setInterviewStartTime(new Date());
    };

    // Handle interview answer submission
    const handleAnswerSubmit = async () => {
        if (currentAnswer.length < INTERVIEW_QUESTIONS[currentQuestionIndex].minLength) {
            setError(`Please provide a bit more detail (at least ${INTERVIEW_QUESTIONS[currentQuestionIndex].minLength} characters)`);
            return;
        }

        setError(null);
        const questionId = INTERVIEW_QUESTIONS[currentQuestionIndex].id as keyof InterviewAnswers;

        // Save answer
        setInterviewAnswers(prev => ({
            ...prev,
            [questionId]: currentAnswer
        }));

        // If AI follow-up is enabled, show thinking animation and generate response
        if (INTERVIEW_QUESTIONS[currentQuestionIndex].aiFollowUp && currentQuestionIndex < INTERVIEW_QUESTIONS.length - 1) {
            setAiTyping(true);

            // Simulate AI processing (in production, this would call the AI)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Generate contextual acknowledgment
            const acknowledgments = [
                "Thanks for sharing that. It helps me understand your perspective.",
                "That's valuable context. Let's continue building your profile.",
                "Interesting background! This will help tailor your experience.",
                "Great insight. This context will help the AI agents serve you better."
            ];
            setAiResponse(acknowledgments[currentQuestionIndex] || "Got it!");
            setAiTyping(false);

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Move to next question or complete interview
        if (currentQuestionIndex < INTERVIEW_QUESTIONS.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setCurrentAnswer("");
            setAiResponse("");
        } else {
            // Interview complete - generate first 48 hours plan
            await generateFirst48HoursPlan();
        }
    };

    // Generate First 48 Hours Plan
    const generateFirst48HoursPlan = async () => {
        setGeneratingPlan(true);
        setStep("first48");

        try {
            // In production, this would call the AI planner agent
            // For now, generate contextual tasks based on form data
            const tasks: First48Task[] = [
                {
                    id: "1",
                    title: "Validate Problem Statement",
                    description: `Interview 5 potential customers in ${formData.targetDemographic.replace(/_/g, " ")} segment to validate the problem you're solving.`,
                    assumption: "The problem is real and painful enough for customers to pay for a solution",
                    timeHours: 4,
                    priority: "high"
                },
                {
                    id: "2",
                    title: "Competitive Landscape Research",
                    description: `Research 5-10 competitors in the ${formData.industry} space. Document their pricing, features, and gaps.`,
                    assumption: "There's room for differentiation in the market",
                    timeHours: 3,
                    priority: "high"
                },
                {
                    id: "3",
                    title: "Define MVP Scope",
                    description: `List the minimum features needed to test "${formData.oneSentencePitch}". Focus on what's essential for first 10 users.`,
                    assumption: "Users will adopt a minimal solution if it solves their core problem",
                    timeHours: 2,
                    priority: "high"
                },
                {
                    id: "4",
                    title: "Identify Early Adopter Channels",
                    description: "Find 3 online communities or platforms where your target customers actively engage. Join and observe.",
                    assumption: "Your target customers are reachable through specific channels",
                    timeHours: 2,
                    priority: "medium"
                },
                {
                    id: "5",
                    title: "Draft Landing Page Copy",
                    description: "Write the headline, subheadline, and 3 key benefits for a simple landing page.",
                    assumption: "You can articulate the value proposition clearly",
                    timeHours: 1,
                    priority: "medium"
                },
                {
                    id: "6",
                    title: "Set Up Analytics & Tracking",
                    description: "Create accounts for analytics tools (Google Analytics, Mixpanel) and define key events to track.",
                    assumption: "Data-driven decisions will improve product-market fit",
                    timeHours: 1,
                    priority: "low"
                }
            ];

            // Simulate AI processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            setFirst48Tasks(tasks);
            setGeneratingPlan(false);

        } catch (err: any) {
            console.error("Error generating plan:", err);
            setError("Failed to generate your plan. Please try again.");
            setGeneratingPlan(false);
        }
    };

    // Complete onboarding and create startup
    const handleCompleteOnboarding = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // Calculate interview duration
            const interviewDuration = interviewStartTime
                ? Math.round((new Date().getTime() - interviewStartTime.getTime()) / 60000)
                : 5;

            // Create startup with full data
            const startupId = await withTimeout(
                createStartup(
                    user.uid,
                    formData.name,
                    formData.industry,
                    formData.oneSentencePitch,  // Using pitch as idea
                    formData.vision,
                    formData.problemStatement,
                    {
                        oneSentencePitch: formData.oneSentencePitch,
                        targetDemographic: formData.targetDemographic
                    }
                ),
                20000,
                "Startup creation timed out. Please try again."
            );

            // Update user with intake data AND completion status
            await setDoc(doc(db, "users", user.uid), {
                isOnboardingCompleted: true,
                onboardingCompletedAt: serverTimestamp(),
                founderIntake: {
                    background: interviewAnswers.background,
                    priorExperience: interviewAnswers.experience,
                    riskAppetite: interviewAnswers.risk.toLowerCase().includes("all-in") ? "aggressive"
                        : interviewAnswers.risk.toLowerCase().includes("side") ? "conservative"
                            : "moderate",
                    longTermVision: interviewAnswers.vision,
                    interviewCompletedAt: serverTimestamp(),
                    interviewDurationMinutes: interviewDuration
                },
                demographicSegment: formData.targetDemographic
            }, { merge: true });

            // Store first 48 hours plan
            await setDoc(doc(db, "startups", startupId), {
                oneSentencePitch: formData.oneSentencePitch,
                targetDemographic: formData.targetDemographic,
                first48HoursPlan: {
                    generatedAt: serverTimestamp(),
                    tasks: first48Tasks.map(t => ({
                        ...t,
                        status: "pending"
                    })),
                    completionPercentage: 0
                }
            }, { merge: true });

            // Create tasks from first 48 hours plan
            for (const task of first48Tasks) {
                await setDoc(doc(db, "tasks", `first48_${startupId}_${task.id}`), {
                    startupId,
                    title: task.title,
                    description: task.description,
                    instruction: task.description,
                    reason: `Assumption: ${task.assumption}`,
                    priority: task.priority,
                    status: "pending",
                    createdByAgent: "Onboarding AI",
                    createdAt: serverTimestamp(),
                    isFirst48: true,
                    dueAt: new Date(Date.now() + task.timeHours * 60 * 60 * 1000)
                });
            }

            setCreatedStartupId(startupId);
            setStep("complete");

            // Redirect after brief celebration
            setTimeout(() => {
                router.push("/founder/dashboard");
            }, 3000);

        } catch (err: any) {
            console.error("Error completing onboarding:", err);
            setError(err.message || "Failed to complete setup. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (initializing) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-app p-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary rounded-2xl">
                        <Rocket className="w-8 h-8 text-on-primary" />
                    </div>
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-subtle">
                        Initializing FounderFlow...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app p-4 md:p-8">
            <div className="max-w-4xl mx-auto">

                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-12">
                    {["project", "interview", "first48", "complete"].map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all",
                                step === s
                                    ? "bg-primary text-on-primary scale-110"
                                    : ["project", "interview", "first48", "complete"].indexOf(step) > i
                                        ? "bg-success text-on-primary"
                                        : "bg-surface-alt  text-subtle"
                            )}>
                                {["project", "interview", "first48", "complete"].indexOf(step) > i
                                    ? <CheckCircle2 className="w-5 h-5" />
                                    : i + 1}
                            </div>
                            {i < 3 && (
                                <div className={cn(
                                    "w-16 h-1 rounded-full transition-all",
                                    ["project", "interview", "first48", "complete"].indexOf(step) > i
                                        ? "bg-success"
                                        : "bg-surface-alt "
                                )} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Error Display */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-8 p-4 rounded-2xl bg-danger-soft border border-danger text-danger text-sm font-medium flex items-center gap-2"
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-danger hover:text-danger"
                            >×</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Step 1: Project Creation */}
                <AnimatePresence mode="wait">
                    {step === "project" && (
                        <motion.div
                            key="project"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-soft text-primary rounded-full text-xs font-black uppercase tracking-widest">
                                    <Rocket className="w-4 h-4" />
                                    Step 1 of 4
                                </div>
                                <h1 className="text-h1 text-strong">
                                    Launch Your <span className="text-primary">Project</span>
                                </h1>
                                <p className="text-muted max-w-lg mx-auto">
                                    Let's define your venture. Be specific – this helps our AI agents understand your context.
                                </p>
                            </div>

                            <form onSubmit={handleProjectSubmit} className="space-y-8 max-w-2xl mx-auto">
                                {/* Project Name & Industry */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-overline flex items-center gap-2">
                                            <Rocket className="w-4 h-4 text-primary" />
                                            Startup Name *
                                        </label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. FinPay, HealthMate"
                                            className="input text-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-overline flex items-center gap-2">
                                            <Target className="w-4 h-4 text-primary" />
                                            Industry *
                                        </label>
                                        <select
                                            required
                                            value={formData.industry}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                            className="select text-lg"
                                        >
                                            <option value="" disabled>Select Industry</option>
                                            {INDUSTRIES.map(ind => (
                                                <option key={ind} value={ind}>{ind}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* One-Sentence Pitch */}
                                <div className="space-y-2">
                                    <label className="text-overline flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-primary" />
                                        One-Sentence Pitch *
                                    </label>
                                    <p className="text-xs text-muted">
                                        Explain what you're building in one clear sentence.
                                    </p>
                                    <textarea
                                        required
                                        value={formData.oneSentencePitch}
                                        onChange={(e) => setFormData({ ...formData, oneSentencePitch: e.target.value })}
                                        placeholder="We help [target customer] achieve [benefit] by [unique approach]"
                                        className="input h-24 resize-none"
                                    />
                                </div>

                                {/* Target Demographic - India Specific */}
                                <div className="space-y-3">
                                    <label className="text-overline flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        Target Indian Demographic *
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {INDIAN_DEMOGRAPHICS.map(demo => (
                                            <button
                                                key={demo.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, targetDemographic: demo.value })}
                                                className={cn(
                                                    "p-4 rounded-2xl border text-left transition-all",
                                                    formData.targetDemographic === demo.value
                                                        ? "border-primary bg-primary-soft shadow-card"
                                                        : "border-subtle hover:border-primary"
                                                )}
                                            >
                                                <div className="font-bold text-sm">{demo.label}</div>
                                                <div className="text-xs text-muted mt-1">{demo.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Optional Fields */}
                                <div className="space-y-6 pt-4 border-t border-subtle">
                                    <p className="text-overline">Optional Details</p>

                                    <div className="space-y-2">
                                        <label className="text-overline">
                                            Problem Statement
                                        </label>
                                        <textarea
                                            value={formData.problemStatement}
                                            onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                                            placeholder="What painful problem are you solving?"
                                            className="input h-20 resize-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-overline">
                                            Long-Term Vision
                                        </label>
                                        <textarea
                                            value={formData.vision}
                                            onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                                            placeholder="Where do you see this in 5 years?"
                                            className="input h-20 resize-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full btn-primary hover:scale-[1.02] transition-all"
                                >
                                    Continue to Interview
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* Step 2: AI Intake Interview */}
                    {step === "interview" && (
                        <motion.div
                            key="interview"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-soft text-primary rounded-full text-xs font-black uppercase tracking-widest">
                                    <MessageSquare className="w-4 h-4" />
                                    Step 2 of 4
                                </div>
                                <h1 className="text-h1 text-strong">
                                    Quick <span className="text-primary">Interview</span>
                                </h1>
                                <p className="text-muted max-w-lg mx-auto">
                                    ~5 minutes • This helps personalize your AI co-founder experience
                                </p>
                            </div>

                            {/* Chat Interface */}
                            <div className="max-w-2xl mx-auto">
                                <div className="card overflow-hidden">
                                    {/* Chat Header */}
                                    <div className="p-6 border-b border-subtle bg-surface-alt">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-gradient flex items-center justify-center">
                                                <Sparkles className="w-5 h-5 text-on-primary" />
                                            </div>
                                            <div>
                                                <div className="font-bold">FounderFlow AI</div>
                                                <div className="text-xs text-muted">Getting to know you...</div>
                                            </div>
                                            <div className="ml-auto flex items-center gap-2 text-xs text-subtle">
                                                <Clock className="w-3 h-3" />
                                                {currentQuestionIndex + 1} / {INTERVIEW_QUESTIONS.length}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chat Messages */}
                                    <div className="p-6 max-h-[400px] overflow-y-auto space-y-6">
                                        {/* Previous Q&As */}
                                        {INTERVIEW_QUESTIONS.slice(0, currentQuestionIndex).map((q, i) => (
                                            <div key={q.id} className="space-y-4">
                                                <div className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0">
                                                        <Sparkles className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div className="bg-surface-alt rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                                                        <p className="text-sm">{q.question}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 justify-end">
                                                    <div className="bg-primary text-on-primary rounded-2xl rounded-tr-sm p-4 max-w-[80%]">
                                                        <p className="text-sm">{interviewAnswers[q.id as keyof InterviewAnswers]}</p>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center flex-shrink-0">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Current Question */}
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0">
                                                <Sparkles className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="bg-surface-alt rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                                                <p className="text-sm font-medium">
                                                    {INTERVIEW_QUESTIONS[currentQuestionIndex].question}
                                                </p>
                                            </div>
                                        </div>

                                        {/* AI Response */}
                                        {aiTyping && (
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-soft dark:bg-primary-soft flex items-center justify-center flex-shrink-0">
                                                    <Sparkles className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="bg-surface-alt rounded-2xl rounded-tl-sm p-4">
                                                    <div className="flex gap-1">
                                                        <span className="w-2 h-2 bg-subtle rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                        <span className="w-2 h-2 bg-subtle rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                        <span className="w-2 h-2 bg-subtle rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {aiResponse && (
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-soft dark:bg-primary-soft flex items-center justify-center flex-shrink-0">
                                                    <Sparkles className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="bg-surface-alt rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                                                    <p className="text-sm text-muted">
                                                        {aiResponse}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div ref={chatEndRef} />
                                    </div>

                                    {/* Input Area */}
                                    <div className="p-4 border-t border-subtle bg-surface-alt">
                                        <div className="flex gap-3">
                                            <textarea
                                                value={currentAnswer}
                                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                                placeholder={INTERVIEW_QUESTIONS[currentQuestionIndex].placeholder}
                                                className="input min-h-[80px] resize-none"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleAnswerSubmit();
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={handleAnswerSubmit}
                                                disabled={currentAnswer.length < INTERVIEW_QUESTIONS[currentQuestionIndex].minLength || aiTyping}
                                                className="btn-primary self-end"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-subtle mt-2 text-center">
                                            Press Enter to send • Shift+Enter for new line
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: First 48 Hours Plan */}
                    {step === "first48" && (
                        <motion.div
                            key="first48"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-soft text-primary rounded-full text-xs font-black uppercase tracking-widest">
                                    <Clock className="w-4 h-4" />
                                    Step 3 of 4
                                </div>
                                <h1 className="text-4xl font-black tracking-tight">
                                    Your First <span className="text-primary">48 Hours</span>
                                </h1>
                                <p className="text-muted max-w-lg mx-auto">
                                    AI-generated action plan to validate your core assumptions fast.
                                </p>
                            </div>

                            {generatingPlan ? (
                                <div className="max-w-2xl mx-auto py-20 flex flex-col items-center gap-6">
                                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <div className="text-center space-y-2">
                                        <p className="font-bold">Generating your personalized plan...</p>
                                        <p className="text-sm text-muted">
                                            Analyzing your startup context and creating actionable tasks
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-3xl mx-auto space-y-6">
                                    {/* Summary Card */}
                                    <div className="p-6 bg-primary-gradient rounded-3xl text-on-primary">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Zap className="w-6 h-6" />
                                            <span className="font-black uppercase tracking-widest text-sm">Sprint Overview</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <div className="text-3xl font-black">{first48Tasks.length}</div>
                                                <div className="text-xs opacity-80">Tasks</div>
                                            </div>
                                            <div className="text-center border-x border-subtle">
                                                <div className="text-3xl font-black">
                                                    {first48Tasks.reduce((acc, t) => acc + t.timeHours, 0)}h
                                                </div>
                                                <div className="text-xs opacity-80">Total Time</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-3xl font-black">
                                                    {first48Tasks.filter(t => t.priority === "high").length}
                                                </div>
                                                <div className="text-xs opacity-80">High Priority</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Task List */}
                                    <div className="space-y-4">
                                        {first48Tasks.map((task, i) => (
                                            <motion.div
                                                key={task.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="p-6 bg-surface rounded-2xl border border-subtle space-y-3"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center text-on-primary font-bold text-sm",
                                                            task.priority === "high" ? "bg-danger" :
                                                                task.priority === "medium" ? "bg-warning" :
                                                                    "bg-success"
                                                        )}>
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold">{task.title}</h3>
                                                            <p className="text-sm text-muted">{task.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="font-bold text-primary">{task.timeHours}h</div>
                                                        <div className={cn(
                                                            "text-xs font-bold uppercase",
                                                            task.priority === "high" ? "text-danger" :
                                                                task.priority === "medium" ? "text-warning" :
                                                                    "text-success"
                                                        )}>
                                                            {task.priority}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="pt-3 border-t border-subtle">
                                                    <p className="text-xs text-subtle">
                                                        <strong className="text-muted">Validating:</strong> {task.assumption}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleCompleteOnboarding}
                                        disabled={loading}
                                        className="w-full btn-primary hover:scale-[1.02] transition-all disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-subtle border-t-primary rounded-full animate-spin" />
                                                Setting Up Your Workspace...
                                            </>
                                        ) : (
                                            <>
                                                Launch Workspace
                                                <Rocket className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Step 4: Complete */}
                    {step === "complete" && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-20 text-center space-y-8"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.2 }}
                                className="w-24 h-24 mx-auto rounded-full bg-success flex items-center justify-center"
                            >
                                <CheckCircle2 className="w-12 h-12 text-on-primary" />
                            </motion.div>

                            <div className="space-y-4">
                                <h1 className="text-h1 text-strong">
                                    You're All Set! 🚀
                                </h1>
                                <p className="text-muted max-w-lg mx-auto">
                                    Your workspace is ready. Redirecting to your dashboard...
                                </p>
                            </div>

                            <div className="flex justify-center gap-4">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

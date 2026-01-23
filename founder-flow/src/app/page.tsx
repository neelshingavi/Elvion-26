"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Rocket, Zap, Shield } from "lucide-react";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navbar */}
        <nav className="flex items-center justify-between py-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold tracking-tighter"
          >
            Founder<span className="text-indigo-500">Flow</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/login"
              className="rounded-full bg-white/5 px-6 py-2 text-sm font-medium transition-colors hover:bg-white/10"
            >
              Sign In
            </Link>
          </motion.div>
        </nav>

        {/* Hero Section */}
        <main className="flex min-h-[80vh] flex-col items-center justify-center text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-8"
          >
            <motion.div variants={itemVariants} className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-lg transition duration-200" />
              <div className="relative rounded-full border border-white/10 bg-neutral-900/50 px-4 py-1.5 text-sm text-neutral-300 backdrop-blur-md">
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
                The Future of Startup Management
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="max-w-4xl bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl"
            >
              Build Your Startup <br />
              <span className="text-indigo-500">Without the Chaos</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="max-w-2xl text-lg text-neutral-400 sm:text-xl"
            >
              Streamline your workflow, manage tasks, and track progress in one
              unified platform designed for modern founders.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Link
                href="/login"
                className="group relative flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3 font-semibold text-white transition-all hover:bg-indigo-500"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-8 py-3 font-semibold text-white transition-colors hover:bg-white/5"
              >
                Learn More
              </Link>
            </motion.div>
          </motion.div>
        </main>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="my-32 grid gap-8 md:grid-cols-3"
        >
          {[
            {
              icon: Rocket,
              title: "Fast Deployment",
              desc: "Launch your projects with speed and precision.",
            },
            {
              icon: Zap,
              title: "Automated Workflows",
              desc: "Let AI handle the routine tasks while you build.",
            },
            {
              icon: Shield,
              title: "Secure by Design",
              desc: "Enterprise-grade security for your startup data.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-white/10 bg-white/5 p-8 transition-colors hover:border-indigo-500/30 hover:bg-white/10"
            >
              <feature.icon className="mb-4 h-8 w-8 text-indigo-500" />
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-neutral-400">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

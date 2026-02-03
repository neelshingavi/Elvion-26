"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Rocket, Zap, Shield, CheckCircle } from "lucide-react";

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

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
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
            className="hidden md:flex items-center gap-8"
          >
            <Link href="#features" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">How it Works</Link>
            <Link href="#testimonials" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">Reviews</Link>
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

        {/* Features Grid */}
        <section id="features" className="py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">Everything you need to launch</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">From idea validation to scaling your operations, FounderFlow provides the toolset for every stage of your journey.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="grid gap-8 md:grid-cols-3"
          >
            {[
              {
                icon: Rocket,
                title: "AI Idea Validation",
                desc: "Get instant feedback on your startup ideas with our advanced Gemini-powered analysis agent.",
              },
              {
                icon: Zap,
                title: "Smart Roadmaps",
                desc: "Automatically generate actionable, step-by-step execution plans tailored to your business model.",
              },
              {
                icon: Shield,
                title: "Due Diligence",
                desc: "Organize your traction, metrics, and documents in a secure data room ready for sharing.",
              },
              {
                icon: CheckCircle,
                title: "Task Management",
                desc: "A Kanban-style board designed specifically for small, agile founding teams.",
              },
              {
                icon: Shield, // Reusing shield for security representation or similar
                title: "Legal Templates",
                desc: "Access a library of vetted legal templates for incorporation, hiring, and partnerships.",
              },
              {
                icon: Rocket, // Reusing Rocket
                title: "Market Insights",
                desc: "Real-time market data and competitor analysis to keep you ahead of the curve.",
              }

            ].map((feature, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-white/10 bg-white/5 p-8 transition-colors hover:border-indigo-500/30 hover:bg-white/10"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-indigo-500/10 p-3 text-indigo-500 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-neutral-400">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">From Zero to One</h2>
            <p className="text-neutral-400">Your journey from concept to company in three simple steps.</p>
          </div>

          <div className="grid gap-12 md:grid-cols-3 relative z-10">
            {[
              { step: "01", title: "Validate", desc: "Input your idea and let our AI agents stress-test it against market data." },
              { step: "02", title: "Plan", desc: "Generate a comprehensive roadmap with milestones and resource requirements." },
              { step: "03", title: "Execute", desc: "Track progress, manage tasks, and collaborate with your team in real-time." }
            ].map((item, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                key={i}
                className="relative flex flex-col items-center text-center p-6"
              >
                <div className="text-6xl font-bold text-white/5 mb-4 font-sans">{item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-neutral-400">{item.desc}</p>
                {i !== 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24">
          <h2 className="text-3xl font-bold sm:text-4xl mb-12 text-center">Loved by Founders</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { quote: "FounderFlow saved us months of wasted effort by validating our pivot early.", author: "Sarah Chen", role: "CEO, TechNova" },
              { quote: "The roadmap generation feature is like having a McKinsey consultant in your pocket.", author: "Marcus Johnson", role: "Founder, GreenScale" },
              { quote: "Finally, a project management tool that actually understands the startup chaos.", author: "Elena Rodriguez", role: "CTO, FastPay" }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white/5 border border-white/5"
              >
                <p className="text-lg text-neutral-300 mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm">
                    {testimonial.author[0]}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-xs text-neutral-500">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold sm:text-4xl mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Is FounderFlow free to start?", a: "Yes, we offer a generous free tier for solo founders and pre-seed teams." },
              { q: "Can I invite my co-founders?", a: "Absolutely. Team collaboration is built into the core of the platform." },
              { q: "How accurate is the AI validation?", a: "Our models utilize real-time market data to provide directional insights, but human judgment is always key." },
              { q: "Do you offer investor connections?", a: "We focus on building the strongest possible company, and provide tools to help you network directly with other founders." }
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                  <p className="text-neutral-400">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-center">
          <div className="relative rounded-3xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-12 overflow-hidden border border-white/10">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold sm:text-5xl mb-6">Ready to build the future?</h2>
              <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">Join thousands of founders who are building faster and smarter with FounderFlow.</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-white text-indigo-900 px-8 py-4 font-bold text-lg hover:bg-neutral-200 transition-colors"
              >
                Start for Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/20 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 p-32 bg-purple-500/20 blur-[100px] rounded-full" />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 text-neutral-400 text-sm">
          <div className="grid gap-8 md:grid-cols-4 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="text-2xl font-bold text-white mb-4">Founder<span className="text-indigo-500">Flow</span></div>
              <p>Empowering the next generation of unicorn founders.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-indigo-500 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-white/5">
            © {new Date().getFullYear()} FounderFlow Inc. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}

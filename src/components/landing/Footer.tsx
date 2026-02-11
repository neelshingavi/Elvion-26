"use client";

import Link from "next/link";
import { Twitter, Linkedin, Github, Instagram } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black/80 backdrop-blur-md border-t border-white/10 pt-16 pb-8 pointer-events-auto">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div>
                        <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2 mb-6">
                            <span className="text-white">Founder</span>
                            <span className="text-indigo-500">Flow</span>
                        </Link>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-xs">
                            The operating system for ambitious founders. Validating, structuring, and scaling the next generation of startups.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                                <Github className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h3 className="font-bold text-white mb-6">Product</h3>
                        <ul className="space-y-4 text-sm text-zinc-400">
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Idea Validation</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Roadmaps</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-white mb-6">Resources</h3>
                        <ul className="space-y-4 text-sm text-zinc-400">
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Founder's Guide</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Community</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Help Center</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-white mb-6">Company</h3>
                        <ul className="space-y-4 text-sm text-zinc-400">
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">About Us</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Careers</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Legal</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
                    <p>© {new Date().getFullYear()} FounderFlow Inc. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

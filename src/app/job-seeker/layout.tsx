import Link from "next/link";
import {
    LayoutDashboard,
    Search,
    BookOpen,
    UserCircle,
    Settings,
    Briefcase,
    MessageSquare
} from "lucide-react";

export default function JobSeekerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const navItems = [
        { name: "Dashboard", href: "/job-seeker/dashboard", icon: LayoutDashboard },
        { name: "Matches", href: "/job-seeker/matches", icon: Search },
        { name: "Chat", href: "/founder/chat", icon: MessageSquare },
        { name: "Profile", href: "/job-seeker/profile", icon: UserCircle },
    ];

    return (
        <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#050505]">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-6 flex flex-col fixed h-full bg-white dark:bg-zinc-950 z-50 hidden md:flex">
                <div className="mb-8 px-2">
                    <h1 className="text-xl font-bold tracking-tight">FounderFlow <span className="text-zinc-400 font-normal">Talent</span></h1>
                </div>

                <nav className="space-y-1 flex-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white transition-colors"
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                    <button className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white transition-colors">
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                </div>
            </aside>

            {/* Mobile Header (simplified) */}
            <div className="md:hidden fixed top-0 w-full p-4 bg-white/80 backdrop-blur border-b z-40">
                <h1 className="font-bold">FounderFlow Talent</h1>
            </div>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8 pt-20 md:pt-8 min-h-screen">
                <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}

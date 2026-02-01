import { Loader2 } from "lucide-react";

export function Loader({ className = "", size = "md" }: { className?: string, size?: "sm" | "md" | "lg" }) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12"
    };

    return (
        <div className={`flex items-center justify-center h-full w-full ${className}`}>
            <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-500`} />
        </div>
    );
}

export function FullPageLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <Loader size="lg" />
                <p className="text-sm font-medium text-zinc-500 animate-pulse">Loading FounderFlow...</p>
            </div>
        </div>
    );
}

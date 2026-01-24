"use client";

import { MessagingHub } from "@/components/messaging/MessagingHub";

export default function AdminMessagesPage() {
    return (
        <div className="fixed inset-0 md:left-64 p-4 bg-zinc-950 z-10 overflow-hidden flex flex-col">
            <MessagingHub roleContext="admin" />
        </div>
    );
}

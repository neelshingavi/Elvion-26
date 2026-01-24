"use client";

import { MessagingHub } from "@/components/messaging/MessagingHub";

export default function JobSeekerMessagesPage() {
    return (
        <div className="fixed inset-0 top-18 md:top-0 md:left-64 p-4 bg-[#fafafa] dark:bg-[#050505] z-10 overflow-hidden flex flex-col">
            <MessagingHub roleContext="job-seeker" />
        </div>
    );
}

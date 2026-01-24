export interface Skill {
    id: string;
    name: string;
    level: "beginner" | "intermediate" | "expert";
    years: number;
}

export interface Experience {
    id: string;
    role: string;
    company: string;
    duration: string;
    isStartup: boolean;
    description: string;
}

export interface JobSeekerProfile {
    uid: string;
    displayName: string;
    email: string;
    tagline: string;
    about: string;
    skills: Skill[];
    experience: Experience[];
    preferences: {
        roles: string[];
        stages: string[]; // "seed", "series_a", etc.
        remote: boolean;
        salaryRange: { min: number; max: number };
    };
    readinessScore: number; // 0-100
    createdAt: any;
    updatedAt: any;
}

export interface JobApplication {
    id: string;
    jobSeekerId: string;
    startupId: string;
    roleId?: string; // Optional if applying generally
    status: "applied" | "review" | "interview" | "offer" | "rejected";
    coverNote: string;
    appliedAt: any;
}

export interface JobMatch {
    startupId: string;
    matchScore: number;
    reason: string;
    missingSkills: string[];
    urgency: "high" | "medium" | "low";
}

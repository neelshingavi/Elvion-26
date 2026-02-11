
export interface WeeklyMetric {
    id: string;
    name: string;
    value: number | string;
    change?: number; // percentage change
    trend?: 'up' | 'down' | 'neutral';
}

export interface Goal {
    id: string;
    text: string;
    isCompleted: boolean;
    reasonForFailure?: string; // Optional, required if isCompleted is false
    category?: 'growth' | 'product' | 'hiring' | 'finance' | 'other';
}

export interface Win {
    id: string;
    text: string;
    type: 'major' | 'small' | 'unexpected';
}

export interface Challenge {
    id: string;
    obstacle: string;
    rootCause: string;
    blocker: string;
    supportNeeded: string;
}

export interface Decision {
    id: string;
    decision: string;
    rationale: string;
    expectedImpact: string;
}

export interface TeamSentiment {
    productivityRating: number; // 1-10
    energyLevel: number; // 1-10
    hiringProgress?: string;
}

export interface NextWeekCommitment {
    topPriorities: string[]; // Max 3
    mustWinGoal: string;
    keyMetricTarget: string;
}

export interface WeeklyReview {
    id?: string; // Firestore ID
    userId: string;
    startupId: string;
    weekNumber: number;
    year: number;
    createdAt: Date | any; // allow Firestore Timestamp
    updatedAt: Date | any;
    status: 'draft' | 'completed';

    // Section 1: Snapshot
    metrics: {
        revenue: string;
        keyMetric: WeeklyMetric;
        burnRate?: string;
        teamSize?: number;
    };

    // Section 2: Goals (Review of previous week)
    pastGoals: Goal[];

    // Section 3: Wins
    wins: Win[];

    // Section 4: Challenges
    challenges: Challenge[];

    // Section 5: Decisions
    decisions: Decision[];

    // Section 6: Team
    sentiment: TeamSentiment;

    // Section 7: Future
    nextWeek: NextWeekCommitment;
}

import { Timestamp } from "firebase/firestore";

export type ConnectionStatus = "ACTIVE" | "PAUSED" | "REVOKED";

/**
 * A Connection is an explicit link between an investor and a founder for a specific project.
 * Deals are scoped to a connection.
 */
export interface Connection {
    connectionId: string;
    investorId: string;
    founderId: string;
    projectId: string;
    status: ConnectionStatus;
    createdAt: Timestamp;
    lastActivityAt: Timestamp;
    metadata?: {
        projectName?: string;
        investorName?: string;
        founderName?: string;
    };
}

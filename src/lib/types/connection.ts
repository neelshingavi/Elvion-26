import { Timestamp } from "firebase/firestore";

export type ConnectionStatus = "ACTIVE" | "PAUSED" | "REVOKED";

/**
 * A Connection represents a link between two founders in the ecosystem.
 * This is used for founder-to-founder networking and collaboration.
 */
export interface Connection {
    connectionId: string;
    founderId1: string;
    founderId2: string;
    status: ConnectionStatus;
    createdAt: Timestamp;
    lastActivityAt: Timestamp;
    metadata?: {
        notes?: string;
        tags?: string[];
    };
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    getStartup,
    getStartupMemory,
    getTasks,
    getAgentRuns,
    getUserData,
    Startup,
    StartupMemory,
    Task,
    AgentRun,
    UserData
} from "@/lib/startup-service";
import { db } from "@/lib/firebase";
import { onSnapshot, doc, collection, query, where, orderBy } from "firebase/firestore";

export function useStartup() {
    const { user } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [startup, setStartup] = useState<Startup | null>(null);
    const [memory, setMemory] = useState<StartupMemory[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // 1. Listen to user data for activeStartupId
        const userUnsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                setUserData({ uid: user.uid, ...doc.data() } as UserData);
            } else {
                setUserData(null);
                setLoading(false); // Release loading if no user doc exists
            }
        }, (err) => {
            console.error("User subscription error:", err);
            setLoading(false);
        });

        return () => userUnsubscribe();
    }, [user]);

    useEffect(() => {
        if (!userData?.activeStartupId) {
            setStartup(null);
            setMemory([]);
            setTasks([]);
            setAgentRuns([]);
            if (userData) setLoading(false);
            return;
        }

        const startupId = userData.activeStartupId;

        // 2. Listen to startup changes
        const startupUnsubscribe = onSnapshot(doc(db, "startups", startupId), (doc) => {
            if (doc.exists()) {
                setStartup({ startupId: doc.id, ...doc.data() } as Startup);
            }
            setLoading(false);
        });

        // 3. Listen to memory
        const memoryQuery = query(
            collection(db, "startupMemory"),
            where("startupId", "==", startupId),
            orderBy("timestamp", "desc")
        );
        const memoryUnsubscribe = onSnapshot(memoryQuery, (snapshot) => {
            setMemory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any);
        });

        // 4. Listen to tasks
        const tasksQuery = query(
            collection(db, "tasks"),
            where("startupId", "==", startupId),
            orderBy("createdAt", "desc")
        );
        const tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any);
        });

        // 5. Listen to agent runs
        const agentRunsQuery = query(
            collection(db, "agentRuns"),
            where("startupId", "==", startupId),
            orderBy("createdAt", "desc")
        );
        const agentRunsUnsubscribe = onSnapshot(agentRunsQuery, (snapshot) => {
            setAgentRuns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any);
        });

        return () => {
            startupUnsubscribe();
            memoryUnsubscribe();
            tasksUnsubscribe();
            agentRunsUnsubscribe();
        };
    }, [userData?.activeStartupId]);

    return {
        userData,
        startup,
        memory,
        tasks,
        agentRuns,
        loading
    };
}

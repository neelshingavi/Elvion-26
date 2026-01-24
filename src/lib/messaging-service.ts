import { db } from "./firebase";
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    onSnapshot,
    doc,
    setDoc
} from "firebase/firestore";

export interface Message {
    id: string;
    chatId: string;
    senderId: string;
    text: string;
    timestamp: any;
}

export interface ChatRoom {
    id: string;
    participants: string[];
    lastMessage?: string;
    lastTimestamp?: any;
}

const getChatId = (uid1: string, uid2: string) => {
    return [uid1, uid2].sort().join("_");
};

export const sendMessage = async (senderId: string, receiverId: string, text: string) => {
    const chatId = getChatId(senderId, receiverId);

    // Add message
    await addDoc(collection(db, `chats/${chatId}/messages`), {
        chatId,
        senderId,
        text,
        timestamp: serverTimestamp()
    });

    // Update/Create chat room summary
    await setDoc(doc(db, "chat_rooms", chatId), {
        participants: [senderId, receiverId],
        lastMessage: text,
        lastTimestamp: serverTimestamp()
    }, { merge: true });
};

export const getMessages = (senderId: string, receiverId: string, callback: (messages: Message[]) => void) => {
    const chatId = getChatId(senderId, receiverId);
    const q = query(
        collection(db, `chats/${chatId}/messages`),
        orderBy("timestamp", "asc")
    );

    return onSnapshot(q, (snap) => {
        const messages = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Message[];
        callback(messages);
    });
};

export const getUserChatRooms = (uid: string, callback: (rooms: ChatRoom[]) => void) => {
    const q = query(
        collection(db, "chat_rooms"),
        where("participants", "array-contains", uid),
        orderBy("lastTimestamp", "desc")
    );

    return onSnapshot(q, (snap) => {
        const rooms = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ChatRoom[];
        callback(rooms);
    });
};

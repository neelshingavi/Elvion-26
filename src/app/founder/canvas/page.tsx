"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Type,
    List,
    ListOrdered,
    Quote,
    Code,
    Table2,
    Minus,
    Sparkles,
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    Lightbulb,
    Clock,
    Save,
    MoreVertical,
    Trash2,
    ArrowUp,
    ArrowDown,
    Copy,
    GripVertical,
    MessageSquare,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

// Block types
type BlockType =
    | "heading1"
    | "heading2"
    | "heading3"
    | "paragraph"
    | "bullet_list"
    | "numbered_list"
    | "quote"
    | "code"
    | "divider"
    | "ai_suggestion";

interface Block {
    id: string;
    type: BlockType;
    content: string;
    metadata?: Record<string, any>;
    aiAnnotations?: AIAnnotation[];
    createdAt: Date;
    updatedAt: Date;
}

interface AIAnnotation {
    id: string;
    type: "warning" | "suggestion" | "insight" | "risk";
    message: string;
    confidence: number;
    dismissed: boolean;
}

interface CanvasDocument {
    id: string;
    startupId: string;
    title: string;
    blocks: Block[];
    version: number;
    lastEditedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

// Block type configurations
const BLOCK_TYPES = [
    { type: "heading1" as BlockType, label: "Heading 1", icon: Type, shortcut: "# " },
    { type: "heading2" as BlockType, label: "Heading 2", icon: Type, shortcut: "## " },
    { type: "heading3" as BlockType, label: "Heading 3", icon: Type, shortcut: "### " },
    { type: "paragraph" as BlockType, label: "Paragraph", icon: Type, shortcut: "" },
    { type: "bullet_list" as BlockType, label: "Bullet List", icon: List, shortcut: "- " },
    { type: "numbered_list" as BlockType, label: "Numbered List", icon: ListOrdered, shortcut: "1. " },
    { type: "quote" as BlockType, label: "Quote", icon: Quote, shortcut: "> " },
    { type: "code" as BlockType, label: "Code", icon: Code, shortcut: "```" },
    { type: "divider" as BlockType, label: "Divider", icon: Minus, shortcut: "---" },
];

// Sample AI annotations for demo
const SAMPLE_ANNOTATIONS: AIAnnotation[] = [
    {
        id: "1",
        type: "risk",
        message: "This market size assumption seems aggressive. Consider validating with primary research.",
        confidence: 75,
        dismissed: false
    },
    {
        id: "2",
        type: "suggestion",
        message: "Consider adding regulatory compliance section for Indian market.",
        confidence: 85,
        dismissed: false
    }
];

export default function CanvasPage() {
    const { user } = useAuth();

    // State
    const [document, setDocument] = useState<CanvasDocument | null>(null);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [showBlockMenu, setShowBlockMenu] = useState(false);
    const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 });
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [selectedAnnotation, setSelectedAnnotation] = useState<AIAnnotation | null>(null);
    const [aiGenerating, setAiGenerating] = useState(false);

    const editorRef = useRef<HTMLDivElement>(null);

    // Initialize canvas
    useEffect(() => {
        const initializeCanvas = async () => {
            if (!user) return;

            try {
                // Get user's startup
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const userData = userDoc.data();
                const startupId = userData?.activeStartupId;

                if (!startupId) {
                    setLoading(false);
                    return;
                }

                // Check for existing canvas
                const canvasRef = doc(db, "canvases", `${startupId}_main`);
                const canvasDoc = await getDoc(canvasRef);

                if (canvasDoc.exists()) {
                    const data = canvasDoc.data();
                    setDocument({
                        id: canvasDoc.id,
                        startupId,
                        title: data.title,
                        blocks: data.blocks || [],
                        version: data.version || 1,
                        lastEditedBy: data.lastEditedBy,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        updatedAt: data.updatedAt?.toDate() || new Date()
                    });
                    setBlocks(data.blocks || []);
                } else {
                    // Create new canvas with starter blocks
                    const starterBlocks: Block[] = [
                        {
                            id: "block_1",
                            type: "heading1",
                            content: "Strategic Canvas",
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            id: "block_2",
                            type: "paragraph",
                            content: "Start documenting your strategy. Type '/' to see available block types.",
                            aiAnnotations: SAMPLE_ANNOTATIONS,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            id: "block_3",
                            type: "heading2",
                            content: "Problem Statement",
                            createdAt: new Date(),
                            updatedAt: new Date()
                        },
                        {
                            id: "block_4",
                            type: "paragraph",
                            content: "",
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    ];

                    setBlocks(starterBlocks);
                    setDocument({
                        id: `${startupId}_main`,
                        startupId,
                        title: "Strategic Canvas",
                        blocks: starterBlocks,
                        version: 1,
                        lastEditedBy: user.uid,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            } catch (error) {
                console.error("Error initializing canvas:", error);
            } finally {
                setLoading(false);
            }
        };

        initializeCanvas();
    }, [user]);

    // Auto-save
    useEffect(() => {
        const saveTimeout = setTimeout(() => {
            if (document && blocks.length > 0) {
                saveCanvas();
            }
        }, 2000);

        return () => clearTimeout(saveTimeout);
    }, [blocks]);

    // Save canvas
    const saveCanvas = async () => {
        if (!user || !document) return;

        setSaving(true);
        try {
            await setDoc(doc(db, "canvases", document.id), {
                startupId: document.startupId,
                title: document.title,
                blocks: blocks,
                version: document.version + 1,
                lastEditedBy: user.uid,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error saving canvas:", error);
        } finally {
            setSaving(false);
        }
    };

    // Generate unique ID
    const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add new block
    const addBlock = (type: BlockType, afterId?: string) => {
        const newBlock: Block = {
            id: generateId(),
            type,
            content: "",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (afterId) {
            const index = blocks.findIndex(b => b.id === afterId);
            const newBlocks = [...blocks];
            newBlocks.splice(index + 1, 0, newBlock);
            setBlocks(newBlocks);
        } else {
            setBlocks([...blocks, newBlock]);
        }

        setActiveBlockId(newBlock.id);
        setShowBlockMenu(false);
    };

    // Update block content
    const updateBlock = (blockId: string, content: string) => {
        setBlocks(prev => prev.map(block =>
            block.id === blockId
                ? { ...block, content, updatedAt: new Date() }
                : block
        ));
    };

    // Delete block
    const deleteBlock = (blockId: string) => {
        if (blocks.length <= 1) return; // Keep at least one block
        setBlocks(prev => prev.filter(b => b.id !== blockId));
    };

    // Move block
    const moveBlock = (blockId: string, direction: "up" | "down") => {
        const index = blocks.findIndex(b => b.id === blockId);
        if (direction === "up" && index === 0) return;
        if (direction === "down" && index === blocks.length - 1) return;

        const newBlocks = [...blocks];
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
        setBlocks(newBlocks);
    };

    // Handle slash command
    const handleSlashCommand = (blockId: string, e: React.KeyboardEvent) => {
        if (e.key === "/" && blocks.find(b => b.id === blockId)?.content === "") {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            setBlockMenuPosition({ x: rect.left, y: rect.bottom + 8 });
            setShowBlockMenu(true);
            setActiveBlockId(blockId);
        }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (blockId: string, e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            addBlock("paragraph", blockId);
        }

        if (e.key === "Backspace") {
            const block = blocks.find(b => b.id === blockId);
            if (block?.content === "" && blocks.length > 1) {
                e.preventDefault();
                const index = blocks.findIndex(b => b.id === blockId);
                const previousBlock = blocks[index - 1];
                deleteBlock(blockId);
                if (previousBlock) {
                    setActiveBlockId(previousBlock.id);
                }
            }
        }

        handleSlashCommand(blockId, e);
    };

    // Ask AI about selected text
    const askAI = async (prompt: string) => {
        setAiGenerating(true);
        setAiPanelOpen(true);

        // Simulate AI response
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In production, this would call the agent
        setAiGenerating(false);
    };

    // Dismiss annotation
    const dismissAnnotation = (blockId: string, annotationId: string) => {
        setBlocks(prev => prev.map(block => {
            if (block.id === blockId && block.aiAnnotations) {
                return {
                    ...block,
                    aiAnnotations: block.aiAnnotations.map(ann =>
                        ann.id === annotationId ? { ...ann, dismissed: true } : ann
                    )
                };
            }
            return block;
        }));
    };

    // Render block content
    const renderBlockContent = (block: Block) => {
        const baseClasses = "w-full bg-transparent outline-none resize-none caret-indigo-500";

        switch (block.type) {
            case "heading1":
                return (
                    <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(block.id, e)}
                        onFocus={() => setActiveBlockId(block.id)}
                        placeholder="Heading 1"
                        className={cn(baseClasses, "text-4xl font-black tracking-tight min-h-[52px]")}
                        rows={1}
                    />
                );
            case "heading2":
                return (
                    <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(block.id, e)}
                        onFocus={() => setActiveBlockId(block.id)}
                        placeholder="Heading 2"
                        className={cn(baseClasses, "text-2xl font-bold min-h-[40px]")}
                        rows={1}
                    />
                );
            case "heading3":
                return (
                    <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(block.id, e)}
                        onFocus={() => setActiveBlockId(block.id)}
                        placeholder="Heading 3"
                        className={cn(baseClasses, "text-xl font-bold min-h-[32px]")}
                        rows={1}
                    />
                );
            case "bullet_list":
                return (
                    <div className="flex items-start gap-3">
                        <span className="w-2 h-2 mt-2.5 rounded-full bg-subtle" />
                        <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(block.id, e)}
                            onFocus={() => setActiveBlockId(block.id)}
                            placeholder="List item"
                            className={cn(baseClasses, "flex-1 min-h-[28px]")}
                            rows={1}
                        />
                    </div>
                );
            case "numbered_list":
                const index = blocks.filter(b => b.type === "numbered_list").findIndex(b => b.id === block.id) + 1;
                return (
                    <div className="flex items-start gap-3">
                        <span className="w-6 text-subtle font-medium">{index}.</span>
                        <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(block.id, e)}
                            onFocus={() => setActiveBlockId(block.id)}
                            placeholder="List item"
                            className={cn(baseClasses, "flex-1 min-h-[28px]")}
                            rows={1}
                        />
                    </div>
                );
            case "quote":
                return (
                    <div className="border-l-4 border-primary pl-4 italic text-muted">
                        <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(block.id, e)}
                            onFocus={() => setActiveBlockId(block.id)}
                            placeholder="Quote"
                            className={cn(baseClasses, "min-h-[28px]")}
                            rows={1}
                        />
                    </div>
                );
            case "code":
                return (
                    <div className="bg-surface text-subtle rounded-xl p-4 font-mono text-sm">
                        <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(block.id, e)}
                            onFocus={() => setActiveBlockId(block.id)}
                            placeholder="// Code block"
                            className={cn(baseClasses, "min-h-[100px]")}
                        />
                    </div>
                );
            case "divider":
                return <hr className="border-subtle" />;
            case "ai_suggestion":
                return (
                    <div className="bg-primary-soft rounded-xl p-4 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2 text-primary">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">AI Suggestion</span>
                        </div>
                        <p className="text-sm">{block.content}</p>
                    </div>
                );
            default:
                return (
                    <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(block.id, e)}
                        onFocus={() => setActiveBlockId(block.id)}
                        placeholder="Type '/' for commands, or just start writing..."
                        className={cn(baseClasses, "min-h-[28px]")}
                        rows={1}
                    />
                );
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted">Loading canvas...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface dark:bg-[#0a0a0a]">
            {/* Top Bar */}
            <div className="sticky top-0 z-30 bg-surface/80 dark:bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-subtle">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="font-bold text-lg">{document?.title || "Canvas"}</h1>
                        {saving && (
                            <div className="flex items-center gap-2 text-xs text-muted">
                                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </div>
                        )}
                        {!saving && document && (
                            <div className="flex items-center gap-2 text-xs text-subtle">
                                <Save className="w-3 h-3" />
                                Saved
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setAiPanelOpen(!aiPanelOpen)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                aiPanelOpen
                                    ? "bg-primary text-white"
                                    : "bg-surface-alt hover:bg-surface"
                            )}
                        >
                            <Sparkles className="w-4 h-4" />
                            AI Assist
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Main Editor */}
                <div className={cn(
                    "flex-1 transition-all duration-300",
                    aiPanelOpen ? "mr-80" : ""
                )}>
                    <div
                        ref={editorRef}
                        className="max-w-4xl mx-auto px-6 py-12 space-y-4"
                    >
                        {blocks.map((block) => (
                            <div
                                key={block.id}
                                className={cn(
                                    "group relative",
                                    activeBlockId === block.id && "bg-surface-alt  -mx-4 px-4 py-2 rounded-xl"
                                )}
                            >
                                {/* Block Controls */}
                                <div className="absolute -left-12 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            setActiveBlockId(block.id);
                                            setShowBlockMenu(true);
                                        }}
                                        className="p-1.5 hover:bg-surface-alt dark:hover:bg-surface-alt rounded-lg text-subtle"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <button className="p-1.5 hover:bg-surface-alt dark:hover:bg-surface-alt rounded-lg text-subtle cursor-grab">
                                        <GripVertical className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Block Content */}
                                {renderBlockContent(block)}

                                {/* AI Annotations */}
                                {block.aiAnnotations && block.aiAnnotations.filter(a => !a.dismissed).length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {block.aiAnnotations.filter(a => !a.dismissed).map(annotation => (
                                            <motion.div
                                                key={annotation.id}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className={cn(
                                                    "flex items-start gap-3 p-3 rounded-xl text-sm border-l-4",
                                                    annotation.type === "warning" && "bg-warning-soft border-warning",
                                                    annotation.type === "risk" && "bg-danger-soft border-danger",
                                                    annotation.type === "suggestion" && "bg-info-soft border-info",
                                                    annotation.type === "insight" && "bg-success-soft border-success"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                                                    annotation.type === "warning" && "bg-warning-soft text-warning",
                                                    annotation.type === "risk" && "bg-danger-soft text-danger",
                                                    annotation.type === "suggestion" && "bg-info-soft text-info",
                                                    annotation.type === "insight" && "bg-success-soft text-success"
                                                )}>
                                                    {annotation.type === "warning" && <AlertTriangle className="w-3 h-3" />}
                                                    {annotation.type === "risk" && <AlertTriangle className="w-3 h-3" />}
                                                    {annotation.type === "suggestion" && <Lightbulb className="w-3 h-3" />}
                                                    {annotation.type === "insight" && <Sparkles className="w-3 h-3" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-muted">{annotation.message}</p>
                                                    <p className="text-xs text-muted mt-1">
                                                        Confidence: {annotation.confidence}%
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => dismissAnnotation(block.id, annotation.id)}
                                                    className="p-1 hover:bg-black/10 rounded-lg text-subtle hover:text-muted"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Block Menu (on hover) */}
                                <div className="absolute right-0 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => moveBlock(block.id, "up")}
                                            className="p-1.5 hover:bg-surface-alt dark:hover:bg-surface-alt rounded-lg text-subtle"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveBlock(block.id, "down")}
                                            className="p-1.5 hover:bg-surface-alt dark:hover:bg-surface-alt rounded-lg text-subtle"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteBlock(block.id)}
                                            className="p-1.5 hover:bg-danger-soft rounded-lg text-subtle hover:text-danger"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Block Button */}
                        <button
                            onClick={() => addBlock("paragraph")}
                            className="w-full py-4 border-2 border-dashed border-subtle rounded-xl text-subtle hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add block
                        </button>
                    </div>
                </div>

                {/* AI Panel */}
                <AnimatePresence>
                    {aiPanelOpen && (
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-80 bg-surface border-l border-subtle flex flex-col z-20"
                        >
                            {/* Panel Header */}
                            <div className="p-4 border-b border-subtle flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-bold">AI Assistant</span>
                                </div>
                                <button
                                    onClick={() => setAiPanelOpen(false)}
                                    className="p-2 hover:bg-surface-alt dark:hover:bg-surface-alt rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Quick Actions */}
                            <div className="p-4 space-y-2">
                                <p className="text-xs font-bold uppercase tracking-widest text-subtle mb-3">Quick Actions</p>

                                <button
                                    onClick={() => askAI("Suggest improvements for this section")}
                                    className="w-full p-3 text-left rounded-xl bg-surface-alt hover:bg-surface transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <Lightbulb className="w-5 h-5 text-warning" />
                                        <div>
                                            <p className="font-medium text-sm">Suggest Improvements</p>
                                            <p className="text-xs text-muted">Review and enhance content</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => askAI("Find risky assumptions")}
                                    className="w-full p-3 text-left rounded-xl bg-surface-alt hover:bg-surface transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 text-danger" />
                                        <div>
                                            <p className="font-medium text-sm">Find Risky Assumptions</p>
                                            <p className="text-xs text-muted">Stress-test your strategy</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => askAI("Generate tasks from this content")}
                                    className="w-full p-3 text-left rounded-xl bg-surface-alt hover:bg-surface transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <List className="w-5 h-5 text-success" />
                                        <div>
                                            <p className="font-medium text-sm">Generate Tasks</p>
                                            <p className="text-xs text-muted">Create actionable items</p>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* AI Response Area */}
                            {aiGenerating && (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm text-muted">Analyzing...</p>
                                    </div>
                                </div>
                            )}

                            {/* Chat Input */}
                            <div className="mt-auto p-4 border-t border-subtle">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ask about this document..."
                                        className="flex-1 p-3 bg-surface-alt rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                    <button className="p-3 bg-primary text-white rounded-xl hover:bg-primary transition-all">
                                        <MessageSquare className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Block Type Menu */}
            <AnimatePresence>
                {showBlockMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowBlockMenu(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{ left: blockMenuPosition.x, top: blockMenuPosition.y }}
                            className="fixed z-50 w-64 bg-surface rounded-xl border border-subtle shadow-xl overflow-hidden"
                        >
                            <div className="p-2 space-y-1">
                                <p className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-subtle">Block Types</p>
                                {BLOCK_TYPES.map(blockType => (
                                    <button
                                        key={blockType.type}
                                        onClick={() => {
                                            if (activeBlockId) {
                                                // Replace current empty block
                                                setBlocks(prev => prev.map(b =>
                                                    b.id === activeBlockId
                                                        ? { ...b, type: blockType.type }
                                                        : b
                                                ));
                                            } else {
                                                addBlock(blockType.type);
                                            }
                                            setShowBlockMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-alt dark:hover:bg-surface-alt transition-all"
                                    >
                                        <blockType.icon className="w-4 h-4 text-muted" />
                                        <span className="text-sm font-medium">{blockType.label}</span>
                                        {blockType.shortcut && (
                                            <span className="ml-auto text-xs text-subtle font-mono">
                                                {blockType.shortcut}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

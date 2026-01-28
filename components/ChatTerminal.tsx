"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, StopCircle } from "lucide-react";
import { useFishVoice } from "@/lib/use-fish-voice";
import { VoiceOrb, OrbMode } from "./VoiceOrb";

// Helper to extract text content from AI SDK v6 message parts
function getMessageText(message: any): string {
    if (message.content) return message.content;
    if (message.parts) {
        return message.parts
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text)
            .join("");
    }
    return "";
}

export default function ChatTerminal() {
    const [orbMode, setOrbMode] = useState<OrbMode>("idle");
    const [input, setInput] = useState("");

    const { messages, sendMessage, status } = useChat({
        onFinish: () => {
            setOrbMode("idle");
        },
        onError: (error) => {
            console.error("Chat Error:", error);
            setOrbMode("idle");
        },
    });

    const isLoading = status === "streaming" || status === "submitted";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        await sendMessage({ text: input });
        setInput("");
    };

    const { speakStream, flush, volumeLevel, isPlaying, stop } = useFishVoice();
    const lastMessageRef = useRef<string>("");

    // Sync Orb State & Flush Buffer
    useEffect(() => {
        if (isLoading) {
            setOrbMode("thinking");
        } else if (isPlaying) {
            setOrbMode("speaking");
        } else {
            setOrbMode("idle");
        }

        // When loading finishes, flush any remaining text to voice
        if (!isLoading && orbMode === "thinking") {
            flush();
        }
    }, [isLoading, isPlaying, orbMode, flush]);

    // Stream Text to Voice
    useEffect(() => {
        const lastMessage = messages[messages.length - 1] as any;
        if (lastMessage?.role === "assistant") {
            const content = getMessageText(lastMessage);
            const newContent = content.slice(lastMessageRef.current.length);
            if (newContent) {
                speakStream(newContent);
                lastMessageRef.current = content;
            }
        } else {
            lastMessageRef.current = "";
        }
    }, [messages, speakStream]);

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            {/* Dedicated Orb Section for Chat Mode */}
            <div className="flex justify-center py-8">
                <VoiceOrb mode={orbMode} volumeLevel={volumeLevel} />
            </div>

            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-neutral-800 to-neutral-600 rounded-xl blur opacity-20"></div>

                <form
                    onSubmit={(e) => {
                        stop(); // Stop any previous speech
                        handleSubmit(e);
                    }}
                    className="relative flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-xl"
                >
                    <div className="pl-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    <input
                        className="flex-1 bg-transparent border-none text-white placeholder-neutral-500 focus:ring-0 focus:outline-none text-sm font-mono py-2 caret-white"
                        style={{ color: "white" }}
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask my Digital Twin..."
                        autoFocus
                    />

                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 text-white" />
                        )}
                    </button>
                </form>
            </div>

            {/* Transcript Area (Optional - fade out old messages) */}
            <div className="space-y-4 max-h-[200px] overflow-y-auto px-4 scrollbar-hide mask-gradient">
                {messages.slice(-2).map((m: any) => (
                    <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 text-xs font-mono ${m.role === 'user' ? 'text-neutral-500' : 'text-emerald-500'}`}
                    >
                        <span className="uppercase tracking-widest min-w-[60px]">{m.role === 'user' ? 'YOU' : 'ERIK'}</span>
                        <span className="text-neutral-300">{getMessageText(m)}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

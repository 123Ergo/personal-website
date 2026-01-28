"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { VoiceOrb, OrbMode } from "./VoiceOrb";
import { useFishVoice } from "@/lib/use-fish-voice";
import { matchJobDescription } from "@/app/actions/match";
import { cn } from "@/lib/utils";

export default function MatchTerminal() {
    const [orbMode, setOrbMode] = useState<OrbMode>("idle");
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const { play, volumeLevel, isPlaying } = useFishVoice();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setIsUploading(true);
        setError(null);
        setResult(null);
        setOrbMode("thinking");

        try {
            const formData = new FormData();
            formData.append("jobDescription", file);

            const matchResult = await matchJobDescription(formData);
            setResult(matchResult);

            // Start speaking the reasoning
            setOrbMode("speaking");
            await play(matchResult.reasoning);

        } catch (err: any) {
            console.error("Match Error:", err);
            setError(err.message || "An unexpected error occurred.");
            setOrbMode("idle");
        } finally {
            setIsUploading(false);
        }
    }, [play]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] },
        multiple: false,
        disabled: isUploading || orbMode !== "idle",
    });

    // Sync orb mode back to idle when audio finishes
    if (orbMode === "speaking" && !isPlaying) {
        setOrbMode("idle");
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-12">
            {/* Visual Header / Orb Area */}
            <section className="flex flex-col items-center justify-center">
                <VoiceOrb mode={orbMode} volumeLevel={volumeLevel} />
            </section>

            {/* Terminal UI */}
            <div className="relative group">
                {/* Glassmorphism Background */}
                <div className="absolute -inset-1 bg-gradient-to-r from-neutral-800 to-neutral-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Terminal Header */}
                    <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono ml-4">
                            System.CredentialMatcher_v1.0
                        </div>
                    </div>

                    {/* Terminal Body */}
                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            {!result && !error && (
                                <motion.div
                                    key="dropzone"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <div
                                        {...getRootProps()}
                                        className={cn(
                                            "relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer group/dropzone",
                                            isDragActive ? "border-white/40 bg-white/5" : "border-white/10 hover:border-white/20 hover:bg-white/5",
                                            (isUploading || orbMode !== "idle") && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <input {...getInputProps()} />

                                        <div className="p-4 rounded-full bg-white/5 border border-white/10 group-hover/dropzone:scale-110 transition-transform duration-300">
                                            {isUploading ? (
                                                <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
                                            ) : (
                                                <Upload className="w-8 h-8 text-neutral-400" />
                                            )}
                                        </div>

                                        <div className="text-center space-y-1">
                                            <p className="text-sm text-neutral-300 font-medium">
                                                {isDragActive ? "Drop JD to begin" : "Drag & Drop Job Description"}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                Supports PDF or Plain Text
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {result && (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-6 font-mono"
                                >
                                    <div className="flex items-center gap-3 text-emerald-400 border-b border-white/5 pb-4">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="text-xs tracking-tighter uppercase">Match Determination Complete</span>
                                        <span className="ml-auto text-[10px] text-neutral-500">Score: {(result.confidence * 100).toFixed(0)}%</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="text-xs leading-relaxed text-neutral-300">
                                            <span className="text-neutral-500 mr-2">$ cat rationale.txt</span>
                                            {result.reasoning}
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 pt-4">
                                            <div className="space-y-2">
                                                <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                    Key Matches
                                                </div>
                                                {result.keyMatches.map((match: string, i: number) => (
                                                    <div key={i} className="text-[10px] text-neutral-400 flex items-start gap-2">
                                                        <span className="text-neutral-600">-</span>
                                                        {match}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <AlertCircle className="w-3 h-3 text-amber-500" />
                                                    Identified Gaps
                                                </div>
                                                {result.gaps.map((gap: string, i: number) => (
                                                    <div key={i} className="text-[10px] text-neutral-400 flex items-start gap-2">
                                                        <span className="text-neutral-600">-</span>
                                                        {gap}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setResult(null);
                                            setOrbMode("idle");
                                        }}
                                        className="mt-8 text-[10px] text-neutral-500 hover:text-white transition-colors border-t border-white/5 pt-4 w-full text-left flex items-center gap-2 group/reset"
                                    >
                                        <span>{`> Reset System`}</span>
                                        <span className="w-1.5 h-3 bg-white/20 animate-pulse inline-block" />
                                    </button>
                                </motion.div>
                            )}

                            {error && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-6 rounded-lg bg-red-500/5 border border-red-500/20 text-center space-y-4"
                                >
                                    <AlertCircle className="w-8 h-8 text-red-500/40 mx-auto" />
                                    <p className="text-sm text-red-400 font-mono">{error}</p>
                                    <button
                                        onClick={() => setError(null)}
                                        className="text-xs text-neutral-500 hover:text-white underline underline-offset-4"
                                    >
                                        Retry Initialization
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Terminal Footer */}
                    <div className="px-4 py-2 bg-white/5 text-[9px] text-neutral-600 font-mono flex justify-between">
                        <span>ERIK_GOLDHAR_DIGITAL_TWIN</span>
                        <span>STATUS: {orbMode.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

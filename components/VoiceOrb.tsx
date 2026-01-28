"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export type OrbMode = 'idle' | 'thinking' | 'speaking';

interface VoiceOrbProps {
    mode: OrbMode;
    volumeLevel?: number;
}

export function VoiceOrb({ mode, volumeLevel = 0 }: VoiceOrbProps) {
    // Spring for smooth scaling based on volume
    const scaleSpring = useSpring(1, { stiffness: 300, damping: 20 });

    // Transform the spring value to a more dramatic pulse (for speaking state)
    const orbScale = useTransform(scaleSpring, [0, 1], [1, 1.8]);

    useEffect(() => {
        if (mode === 'speaking') {
            scaleSpring.set(1 + volumeLevel);
        } else {
            scaleSpring.set(1);
        }
    }, [mode, volumeLevel, scaleSpring]);

    return (
        <div className="flex flex-col items-center gap-6 py-12">
            <motion.div
                className="relative group"
                style={{ scale: mode === 'speaking' ? orbScale : 1 }}
                animate={
                    mode === 'idle'
                        ? {
                            scale: [1, 1.05, 1],
                            opacity: [0.5, 0.8, 0.5],
                            boxShadow: [
                                "0 0 20px rgba(255,255,255,0.1)",
                                "0 0 40px rgba(255,255,255,0.2)",
                                "0 0 20px rgba(255,255,255,0.1)",
                            ],
                        }
                        : mode === 'thinking'
                            ? {
                                scale: [1, 1.1, 1],
                                opacity: [0.8, 1, 0.8],
                                boxShadow: [
                                    "0 0 30px rgba(255,255,255,0.3)",
                                    "0 0 60px rgba(255,255,255,0.5)",
                                    "0 0 30px rgba(255,255,255,0.3)",
                                ],
                            }
                            : {
                                opacity: 1,
                                boxShadow: `0 0 ${40 + volumeLevel * 100}px rgba(255,255,255,${0.3 + volumeLevel * 0.7})`,
                            }
                }
                transition={
                    mode === 'idle'
                        ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
                        : mode === 'thinking'
                            ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
                            : { type: "spring", stiffness: 500, damping: 30 }
                }
            >
                {/* The Outer Glow */}
                <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl transition-all duration-500" />

                {/* The Core Orb */}
                <div className="relative w-32 h-32 bg-gradient-to-tr from-neutral-900 via-neutral-700 to-white/80 rounded-full flex items-center justify-center overflow-hidden border border-white/20 shadow-inner">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent)]" />

                    {/* Internal Animated Plasma/Glow */}
                    <motion.div
                        className="absolute inset-0 bg-white/5 blur-xl"
                        animate={{
                            scale: mode === 'speaking' ? [1, 1.2, 1] : [1, 1.1, 1],
                            opacity: mode === 'speaking' ? [0.2, 0.5, 0.2] : [0.1, 0.3, 0.1],
                        }}
                        transition={{
                            duration: mode === 'speaking' ? 0.3 : 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Thinking Orbit Ring */}
                    {mode === 'thinking' && (
                        <motion.div
                            className="absolute inset-0 rounded-full border border-white/30 border-t-transparent border-l-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            style={{ scale: 1.5 }}
                        />
                    )}

                    {/* Core Content/Texture */}

                    {/* Core Content/Texture */}
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                    </div>
                </div>
            </motion.div>

            <div className="text-[10px] tracking-[0.4em] uppercase text-neutral-500 font-bold transition-all duration-300">
                {mode === 'idle' && "System Ready"}
                {mode === 'thinking' && "Analyzing Credentials"}
                {mode === 'speaking' && "Synthesizing Rationale"}
            </div>
        </div>
    );
}

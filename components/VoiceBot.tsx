"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

export default function VoiceBot() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Spring for smooth scaling based on volume
    const scaleSpring = useSpring(1, { stiffness: 300, damping: 20 });

    // Transform the spring value to a more dramatic pulse
    const orbScale = useTransform(scaleSpring, [1, 2], [1, 1.5]);

    const setupAudioAnalysis = useCallback(() => {
        if (!audioRef.current) return;

        // Initialize Audio Context on user interaction
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;

            const source = audioContextRef.current.createMediaElementSource(audioRef.current);
            source.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
        }
    }, []);

    const startAnalysis = useCallback(() => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const update = () => {
            if (!analyserRef.current) return;

            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculate average volume (rms-like)
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;

            // Normalize to a scale between 1 and 2
            // Fish Audio usually has strong frequencies, so we adjust sensitivity
            const normalizedScale = 1 + (average / 128);
            scaleSpring.set(normalizedScale);

            animationFrameRef.current = requestAnimationFrame(update);
        };

        update();
    }, [scaleSpring]);

    const stopAnalysis = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        scaleSpring.set(1);
        setIsSpeaking(false);
    }, [scaleSpring]);

    const speak = useCallback(async (phrase: string) => {
        try {
            setIsSpeaking(true);
            setupAudioAnalysis();

            const response = await fetch("/api/voice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: phrase }),
            });

            if (!response.ok) throw new Error("Failed to fetch audio");

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.play();
                startAnalysis();
            }
        } catch (error) {
            console.error("Speech Error:", error);
            setIsSpeaking(false);
        }
    }, [setupAudioAnalysis, startAnalysis]);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    return (
        <div className="flex flex-col items-center gap-6">
            <audio
                ref={audioRef}
                onEnded={stopAnalysis}
                className="hidden"
            />

            <motion.div
                className="relative group cursor-pointer"
                onClick={() => speak("Hello Erik. Fish Audio is now active and synchronized with my physical form. How shall we proceed with the digital twin?")}
                style={{ scale: orbScale }}
                animate={!isSpeaking ? {
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.8, 0.5],
                    boxShadow: [
                        "0 0 20px rgba(255,255,255,0.2)",
                        "0 0 40px rgba(255,255,255,0.4)",
                        "0 0 20px rgba(255,255,255,0.2)"
                    ]
                } : {}}
                transition={!isSpeaking ? {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                } : {}}
            >
                {/* The Outer Glow */}
                <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all duration-500" />

                {/* The Core Orb */}
                <div className="relative w-24 h-24 bg-gradient-to-tr from-neutral-800 via-neutral-400 to-white rounded-full flex items-center justify-center overflow-hidden border border-white/10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)]" />

                    {/* Animated Internal Glow */}
                    <motion.div
                        className="w-full h-full bg-white/5"
                        animate={{
                            opacity: isSpeaking ? [0.2, 0.6, 0.2] : [0.1, 0.3, 0.1],
                        }}
                        transition={{
                            duration: isSpeaking ? 0.5 : 3,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                </div>
            </motion.div>

            <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 font-medium">
                {isSpeaking ? "Speaking..." : "Click to Sync"}
            </p>
        </div>
    );
}

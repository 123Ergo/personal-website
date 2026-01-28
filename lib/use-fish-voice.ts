"use client";

import { useCallback, useRef, useState, useEffect } from "react";

export function useFishVoice() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Audio Queue Management
    const audioQueueRef = useRef<AudioBuffer[]>([]);
    const isProcessingQueueRef = useRef(false);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Text Streaming Buffers
    const sentenceBufferRef = useRef<string>("");

    const initAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.connect(audioContextRef.current.destination);
        }

        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    }, []);

    const startAnalysis = useCallback(() => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const update = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;

            // Normalize to 0-1 range
            const normalized = Math.min(average / 128, 1);
            setVolumeLevel(normalized);

            animationFrameRef.current = requestAnimationFrame(update);
        };

        update();
    }, []);

    const stop = useCallback(() => {
        if (currentSourceRef.current) {
            currentSourceRef.current.stop();
            currentSourceRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        audioQueueRef.current = [];
        isProcessingQueueRef.current = false;
        sentenceBufferRef.current = "";
        setIsPlaying(false);
        setVolumeLevel(0);
    }, []);

    const processQueue = useCallback(async () => {
        if (isProcessingQueueRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) {
            if (audioQueueRef.current.length === 0) {
                setIsPlaying(false);
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                setVolumeLevel(0);
            }
            return;
        }

        isProcessingQueueRef.current = true;
        setIsPlaying(true);
        startAnalysis();

        const audioBuffer = audioQueueRef.current.shift()!;
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyserRef.current!);
        currentSourceRef.current = source;

        source.onended = () => {
            isProcessingQueueRef.current = false;
            // Small delay to prevent chopped sentences
            setTimeout(() => processQueue(), 100);
        };

        source.start(0);
    }, [startAnalysis]);

    const addToQueue = useCallback(async (text: string) => {
        try {
            if (!text.trim()) return;

            initAudioContext();

            const response = await fetch("/api/voice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) throw new Error("Failed to fetch audio");

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);

            audioQueueRef.current.push(audioBuffer);
            processQueue();

        } catch (error) {
            console.error("Fish Voice Playback Error:", error);
        }
    }, [initAudioContext, processQueue]);

    // Public method for simple Play (legacy support)
    const play = useCallback(async (text: string) => {
        stop(); // Clear any existing
        addToQueue(text);
    }, [addToQueue, stop]);

    // Public method for Streaming Text
    const speakStream = useCallback(async (newTextChunk: string) => {
        sentenceBufferRef.current += newTextChunk;

        // Loop to extract all complete sentences
        while (true) {
            // Check for sentence boundaries: punctuation followed by space or end of string
            const sentenceMatch = sentenceBufferRef.current.match(/([^\.!\?]+[\.!\?]+)(\s|$)/);

            if (!sentenceMatch) break;

            const fullSentence = sentenceMatch[1];
            // Update buffer by removing the matched portion
            sentenceBufferRef.current = sentenceBufferRef.current.slice(sentenceMatch[0].length);

            await addToQueue(fullSentence);
        }
    }, [addToQueue]);

    // Force flush the remaining buffer (useful at the end of a stream)
    const flush = useCallback(async () => {
        const remaining = sentenceBufferRef.current.trim();
        if (remaining) {
            sentenceBufferRef.current = "";
            await addToQueue(remaining);
        }
    }, [addToQueue]);

    useEffect(() => {
        return () => {
            stop();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [stop]);

    return { play, speakStream, stop, flush, isPlaying, volumeLevel };
}

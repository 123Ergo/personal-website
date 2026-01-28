import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const apiKey = process.env.FISH_API_KEY;
        const voiceId = process.env.NEXT_PUBLIC_FISH_VOICE_ID;

        if (!apiKey || !voiceId) {
            return NextResponse.json(
                { error: "Fish Audio configuration missing" },
                { status: 500 }
            );
        }

        const response = await fetch("https://api.fish.audio/v1/tts", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text,
                reference_id: voiceId,
                format: "mp3",
                latency: "normal",
                normalize: true,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: "Fish Audio API error", details: errorData },
                { status: response.status }
            );
        }

        // Proxy the audio stream back to the client
        return new Response(response.body, {
            headers: {
                "Content-Type": "audio/mpeg",
            },
        });
    } catch (error) {
        console.error("Fish Audio Proxy Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

import { NextRequest } from "next/server";
import { FishAudioClient } from "fish-audio";

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ error: "Text is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const apiKey = process.env.FISH_API_KEY;
        const voiceId = process.env.NEXT_PUBLIC_FISH_VOICE_ID;

        if (!apiKey || !voiceId) {
            return new Response(
                JSON.stringify({ error: "Fish Audio configuration missing" }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const client = new FishAudioClient({ apiKey });

        const readableStream = await client.textToSpeech.convert({
            text,
            reference_id: voiceId,
            format: "mp3",
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "audio/mpeg",
            },
        });
    } catch (error: any) {
        console.error("TTS Route Error:", error);
        return new Response(
            JSON.stringify({ error: "Internal Server Error", details: error.message }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

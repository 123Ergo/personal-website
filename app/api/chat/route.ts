import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import fs from 'node:fs/promises';
import path from 'node:path';

export const maxDuration = 30;

// Convert AI SDK v6 UIMessage format to CoreMessage format
function convertMessages(messages: any[]) {
    return messages.map((msg) => {
        if (typeof msg.content === 'string') {
            return { role: msg.role, content: msg.content };
        }
        if (msg.parts) {
            const textContent = msg.parts
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text)
                .join('');
            return { role: msg.role, content: textContent };
        }
        return { role: msg.role, content: '' };
    });
}

export async function POST(req: Request) {
    console.log('POST request received.');
    try {
        const { messages: rawMessages } = await req.json();
        const messages = convertMessages(rawMessages);
        console.log('Messages parsed:', messages.length, 'messages');

        // Read knowledge from local JSON file
        const knowledgePath = path.join(process.cwd(), 'public', 'knowledge', 'erik-knowledge.json');
        let fullContext = '';

        try {
            const content = await fs.readFile(knowledgePath, 'utf-8');
            const knowledge = JSON.parse(content);
            fullContext = JSON.stringify(knowledge, null, 2);
            console.log('JSON knowledge loaded successfully.');
        } catch (error) {
            console.error('Error reading JSON knowledge:', error);
            fullContext = '(No structured knowledge available)';
        }

        console.log('Knowledge base context built. Length:', fullContext.length);

        console.log('Calling streamText with Gemini model.');
        const result = streamText({
            model: google('gemini-2.0-flash'),
            system: `You ARE Erik Goldhar's Digital Twin. You speak AS Erik, in FIRST PERSON only.

=== VOICE & PERSONALITY ===
- Warm, enthusiastic, and genuinely helpful
- Dry wit and deadpan humor (think Mitch Hedberg one-liners, not corny jokes)
- Confident but not arrogant—you've done cool stuff but you don't brag
- Toronto through and through—Blue Jays references welcome when natural
- You care deeply about social impact and helping underdogs (nonprofits, small businesses)
- You're a hockey guy, a dad of two young girls, and a dog lover who misses Mimi

=== RESPONSE RULES FOR VOICE ===
1. Keep responses SHORT (1-3 sentences ideal, max 4-5 for complex topics)
2. Speak conversationally—this will be read aloud, so avoid lists and bullet points
3. Use contractions naturally (I'm, don't, can't, we've)
4. No URLs, email addresses, or things awkward to say out loud

=== KNOWLEDGE RULES (NEVER BREAK) ===
1. Your ONLY source is the document below. No external knowledge or assumptions.
2. If something is NOT in the document, say: "Hmm, that's not in my background" or "I don't have that one documented"
3. Never guess, infer, or fabricate details
4. Always use "I", "my", "me"—NEVER "Erik" or "he"

=== ERIK'S COMPLETE KNOWLEDGE BASE ===
${fullContext}
=== END KNOWLEDGE BASE ===

Remember: Short, warm, witty. If it's not in the document, you don't know it.`,
            messages,
        });
        console.log('StreamText initiated. Returning response.');

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response(JSON.stringify({ error: "Failed to generate response", details: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

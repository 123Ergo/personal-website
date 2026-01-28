'use server';

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parsePdf } from '@/lib/pdf-parser';

export async function chatWithErik(messages: any[]) {
    const knowledgeDir = path.join(process.cwd(), 'public', 'knowledge');
    const files = await fs.readdir(knowledgeDir);

    let fullContext = '';

    for (const file of files) {
        const filePath = path.join(knowledgeDir, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile()) {
            if (file.endsWith('.md') || file.endsWith('.txt')) {
                const content = await fs.readFile(filePath, 'utf-8');
                fullContext += `\n--- START OF FILE: ${file} ---\n${content}\n--- END OF FILE: ${file} ---\n`;
            } else if (file.endsWith('.pdf')) {
                try {
                    const buffer = await fs.readFile(filePath);
                    const content = await parsePdf(buffer);
                    fullContext += `\n--- START OF FILE: ${file} (PDF) ---\n${content}\n--- END OF FILE: ${file} ---\n`;
                } catch (error) {
                    console.error(`Error reading PDF ${file}:`, error);
                }
            }
        }
    }

    const result = await streamText({
        model: openai('gpt-4o'),
        system: `You are Erik Goldhar's AI Agent (Persona: The Visionary). You have access to the following knowledge base about Erik. Use it to answer questions broadly and philosophically, representing his persona.

KNOWLEDGE BASE:
${fullContext}
    `,
        messages,
    });

    return result.toTextStreamResponse();
}

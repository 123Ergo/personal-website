'use server';

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

const MatchSchema = z.object({
    isFit: z.boolean().describe('Whether Erik is a good fit for the job description.'),
    reasoning: z.string().describe('Precise reasoning for the fit determination based on the provided knowledge base.'),
    confidence: z.number().min(0).max(1).describe('Confidence score for the determination.'),
    keyMatches: z.array(z.string()).describe('List of key skills or experiences that match.'),
    gaps: z.array(z.string()).describe('List of missing skills or experiences.'),
});

export async function matchJobDescription(formData: FormData) {
    const jobDescriptionFile = formData.get('jobDescription') as File;
    if (!jobDescriptionFile) {
        throw new Error('Job Description file is required.');
    }

    const jobDescriptionText = await jobDescriptionFile.text();

    // Fetch Erik's knowledge from structured JSON
    const knowledgePath = path.join(process.cwd(), 'public', 'knowledge', 'erik-knowledge.json');
    let knowledgeBase = '';

    try {
        const content = await fs.readFile(knowledgePath, 'utf-8');
        const knowledge = JSON.parse(content);
        knowledgeBase = JSON.stringify(knowledge, null, 2);
    } catch (error) {
        console.error('Error reading JSON knowledge for matcher:', error);
        throw new Error('Could not load Erik\'s knowledge base.');
    }

    // Generate determination using Vercel AI SDK
    const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: MatchSchema,
        system: 'You are the Erik Goldhar Credential Matcher. Using ONLY the provided knowledge base, determine if Erik is a fit for the uploaded Job Description. Be precise and conservative. Do NOT assume any skills or experiences not explicitly mentioned in the knowledge base.',
        prompt: `
ERIK'S KNOWLEDGE BASE:
${knowledgeBase}

JOB DESCRIPTION:
${jobDescriptionText}
    `,
    });

    return object;
}

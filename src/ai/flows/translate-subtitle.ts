
// src/ai/flows/translate-subtitle.ts
'use server';

/**
 * @fileOverview A subtitle translation AI agent.
 *
 * - translateSubtitle - A function that handles the subtitle translation process.
 * - TranslateSubtitleInput - The input type for the translateSubtitle function.
 * - TranslateSubtitleOutput - The return type for the translateSubtitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateSubtitleInputSchema = z.object({
  text: z.string().describe('The subtitle text to translate.'),
  targetLanguage: z.string().describe('The target language for the translation.'),
  aiCreativityLevel: z.number().min(0).max(1).optional().describe('The AI creativity level, from 0 (more literal) to 1 (more creative).'),
  aiCustomPrompt: z.string().optional().describe('An optional custom prompt to guide the AI translation.'),
});

export type TranslateSubtitleInput = z.infer<typeof TranslateSubtitleInputSchema>;

const TranslateSubtitleOutputSchema = z.object({
  translatedText: z.string().describe('The translated subtitle text.'),
});

export type TranslateSubtitleOutput = z.infer<typeof TranslateSubtitleOutputSchema>;

export async function translateSubtitle(input: TranslateSubtitleInput): Promise<TranslateSubtitleOutput> {
  return translateSubtitleFlow(input);
}

const translateSubtitlePrompt = ai.definePrompt({
  name: 'translateSubtitlePrompt',
  input: {schema: TranslateSubtitleInputSchema},
  output: {schema: TranslateSubtitleOutputSchema},
  prompt: `Translate the following text to {{targetLanguage}}.
{{#if aiCreativityLevel}}
Adjust the creativity of the translation based on this level: {{aiCreativityLevel}} (where 0 is very literal and 1 is very creative/interpretive).
{{/if}}
{{#if aiCustomPrompt}}
Follow this guidance for the translation: {{{aiCustomPrompt}}}
{{/if}}

Original text:
{{{text}}}

Translated text:`,
});

const translateSubtitleFlow = ai.defineFlow(
  {
    name: 'translateSubtitleFlow',
    inputSchema: TranslateSubtitleInputSchema,
    outputSchema: TranslateSubtitleOutputSchema,
  },
  async input => {
    const {output} = await translateSubtitlePrompt(input);
    return output!;
  }
);

'use server';

/**
 * @fileOverview A flow to improve the quality of subtitles by fixing errors and enhancing grammar.
 *
 * - improveSubtitle - A function that handles the subtitle improvement process.
 * - ImproveSubtitleInput - The input type for the improveSubtitle function.
 * - ImproveSubtitleOutput - The return type for the improveSubtitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveSubtitleInputSchema = z.object({
  subtitleText: z
    .string()
    .describe('The original text of the subtitle to be improved.'),
  targetLanguage: z
    .string()
    .optional()
    .describe('The target language for the subtitle, if translation is needed.'),
});
export type ImproveSubtitleInput = z.infer<typeof ImproveSubtitleInputSchema>;

const ImproveSubtitleOutputSchema = z.object({
  improvedSubtitleText: z
    .string()
    .describe('The improved text of the subtitle after error correction and grammar enhancement.'),
});
export type ImproveSubtitleOutput = z.infer<typeof ImproveSubtitleOutputSchema>;

export async function improveSubtitle(input: ImproveSubtitleInput): Promise<ImproveSubtitleOutput> {
  return improveSubtitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveSubtitlePrompt',
  input: {schema: ImproveSubtitleInputSchema},
  output: {schema: ImproveSubtitleOutputSchema},
  prompt: `You are an expert subtitle editor. Your task is to improve the quality of the given subtitle text. Correct any errors, improve the grammar, and enhance the overall quality of the subtitle.

Original Subtitle Text: {{{subtitleText}}}

Target Language: {{{targetLanguage}}}

Improved Subtitle Text:`, // The improved subtitle should be placed here
});

const improveSubtitleFlow = ai.defineFlow(
  {
    name: 'improveSubtitleFlow',
    inputSchema: ImproveSubtitleInputSchema,
    outputSchema: ImproveSubtitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

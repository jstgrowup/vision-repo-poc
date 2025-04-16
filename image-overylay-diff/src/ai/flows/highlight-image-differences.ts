'use server';
/**
 * @fileOverview Highlights visual differences between two images using bounding boxes.
 *
 * - highlightImageDifferences - A function that highlights the differences between two images.
 * - HighlightImageDifferencesInput - The input type for the highlightImageDifferences function.
 * - HighlightImageDifferencesOutput - The return type for the highlightImageDifferences function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const HighlightImageDifferencesInputSchema = z.object({
  imageAUrl: z.string().describe('The URL of the first image.'),
  imageBUrl: z.string().describe('The URL of the second image.'),
});
export type HighlightImageDifferencesInput = z.infer<typeof HighlightImageDifferencesInputSchema>;

const HighlightImageDifferencesOutputSchema = z.object({
  highlightedImageUrl: z.string().describe('The URL of the image with differences highlighted.'),
  differencesFound: z.boolean().describe('Whether or not differences were detected.'),
  description: z.string().describe('A description of the differences between the images.'),
});
export type HighlightImageDifferencesOutput = z.infer<typeof HighlightImageDifferencesOutputSchema>;

export async function highlightImageDifferences(input: HighlightImageDifferencesInput): Promise<HighlightImageDifferencesOutput> {
  return highlightImageDifferencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'highlightImageDifferencesPrompt',
  input: {
    schema: z.object({
      imageAUrl: z.string().describe('The URL of the first image.'),
      imageBUrl: z.string().describe('The URL of the second image.'),
    }),
  },
  output: {
    schema: z.object({
      highlightedImageUrl: z.string().describe('The URL of the image with differences highlighted.'),
      differencesFound: z.boolean().describe('Whether or not differences were detected.'),
      description: z.string().describe('A description of the differences between the images.'),
    }),
  },
  prompt: `You are an AI that highlights the differences between two images.

You will receive two images, A and B.  You will compare them and highlight the differences in the output image.

Image A: {{media url=imageAUrl}}
Image B: {{media url=imageBUrl}}

Based on your comparison, set the differencesFound boolean.  If differences are found, be sure to highlight them in highlightedImageUrl.
Describe the differences between the two images in the description field.
`,
});

const highlightImageDifferencesFlow = ai.defineFlow<
  typeof HighlightImageDifferencesInputSchema,
  typeof HighlightImageDifferencesOutputSchema
>({
  name: 'highlightImageDifferencesFlow',
  inputSchema: HighlightImageDifferencesInputSchema,
  outputSchema: HighlightImageDifferencesOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});

import { z } from 'zod'

export const FAQChunkSchema = z.object({
  id: z.string(),
  text: z.string(), // The actual OCR'd text from the PDF
  source: z.enum(['CMTA_RA_10863', 'CMO_18_2018', 'CAO_DE_MINIMIS']),
  pageNumber: z.number(),
  vector: z.array(z.number()), // The embedding
  metadata: z.object({
    title: z.string(),
    section: z.string().optional(),
  }),
})

export type FAQChunk = z.infer<typeof FAQChunkSchema>

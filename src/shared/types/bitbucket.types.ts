import { z } from 'zod';

/**
 * Bitbucket Commit Schema
 */
export const BitbucketCommitSchema = z.object({
  hash: z.string(),
  message: z.string(),
  author: z.object({
    raw: z.string(),
    user: z
      .object({
        display_name: z.string(),
        account_id: z.string(),
      })
      .optional(),
  }),
  date: z.string(),
  parents: z.array(
    z.object({
      hash: z.string(),
    })
  ),
});

export type BitbucketCommit = z.infer<typeof BitbucketCommitSchema>;

/**
 * Bitbucket Diff Schema
 */
export const BitbucketDiffSchema = z.object({
  old_path: z.string().optional(),
  new_path: z.string().optional(),
  status: z.enum(['added', 'modified', 'removed']),
  lines_added: z.number().optional(),
  lines_removed: z.number().optional(),
});

export type BitbucketDiff = z.infer<typeof BitbucketDiffSchema>;

/**
 * Code Context for AI Analysis
 */
export interface CodeContext {
  commits: BitbucketCommit[];
  recentChanges: {
    file: string;
    author: string;
    changeType: 'added' | 'modified' | 'removed';
    timestamp: string;
  }[];
}

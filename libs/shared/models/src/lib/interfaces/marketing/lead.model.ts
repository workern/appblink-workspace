export type LeadStatus = 'new' | 'reviewed' | 'contacted' | 'dismissed';
export type LeadSource = 'reddit';

export interface WorkspaceLeadPost {
  id: string;
  title: string;
  description: string;
  subReddit?: string;
  url?: string;
  createdAt?: number;
}

export interface WorkspaceLead {
  id: string;
  /** Source platform handle, e.g. Reddit username */
  name: string;
  externalLink: string;
  source: LeadSource;
  relevanceScore: number;
  status: LeadStatus;
  interestShownAt: any;
  sourcePost: WorkspaceLeadPost;
  /** Which space (app) this lead belongs to */
  space: { id: string };
  createdAt: any;
  updatedAt: any;
}

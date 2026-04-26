import z from 'zod';
import { SearchResult, SaveType } from '@workern/models';

// ============== Interfaces ==============

export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  storedAt?: string; // Firebase Storage path (e.g., 'gs://bucket/path/file.jpg')
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  expiringAt?: number;
}
export interface Author {
  image: string;
  name?: string;
  alternateName?: string;
  url?: string;
}

export interface Image {
  caption?: string;
  height?: string | number;
  width?: string | number;
  url: string;
}

export interface Video {
  uploadDate?: string;
  description?: string;
  name?: string;
  caption?: string;
  height?: string | number;
  width?: string | number;
  contentUrl: string;
  thumbnailUrl: string;
}

export interface InstagramPostResult extends SearchResult {
  type: SaveType.IG_POST;
  metadata?: {
    postId?: string;
    likes?: number;
    comments?: number;
    isCarousel?: boolean;
    carouselCount?: number;
    caption?: string;
    username?: string;
    takenAt?: number;
  };
}

// ============== Zod Schemas ==============
export const instagramPostUrlSchema = z.object({
  postUrl: z
    .url()
    .refine(
      (url) =>
        url.includes('instagram.com/p/') ||
        url.includes('instagram.com/reel/') ||
        url.includes('instagram.com/tv/'),
      { message: 'Must be a valid Instagram post URL' }
    )
});

export const instagramUsernameSchema = z.object({
  username: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[A-Za-z0-9_.]+$/, 'Invalid Instagram username format')
});

export const instagramStorySchema = z.object({
  username: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[A-Za-z0-9_.]+$/, 'Invalid Instagram username format')
});

export const instagramUserIdStorySchema = z.object({
  id: z.string().min(1, 'User ID is required')
});

import axios from 'axios';
import { logger } from 'firebase-functions';
import { SaveType, SearchResult } from '@workern/models';
import { db, HIKER_API_KEY } from '../../global';
import { MediaItem } from './types';
import { getAutoId } from '../../utils/firebase.utils';
import {
  NormalizedStoryResult,
  StoryMention,
  StoryLink,
  StoryMusic,
  InstagramStoryMention,
  InstagramStoryLinkSticker,
  InstagramStoriesResult,
  InstagramStoryItem,
  InstagramStoryReel,
  InstagramHighlight,
  InstagramUserInfo,
  InstagramUserCache
} from '@workern/models';
// ============== Interfaces ==============

// ============== HikerAPI Configuration ==============
const HIKER_API_BASE_URL = 'https://api.hikerapi.com';

const getHikerApiKey = (): string => {
  const key = HIKER_API_KEY.value();
  if (!key) {
    throw new Error(
      'HIKER_API_KEY is not configured. Please set the environment variable.'
    );
  }
  return key;
};

// ============== HikerAPI Functions ==============

/**
 * Options for HikerAPI story requests
 */
export interface HikerAPIStoryOptions {
  force?: boolean; // Skip account privacy check
  safe_int?: boolean; // Convert all big integers to strings
}

function getInstagramUserDocRef(username: string, appId: string) {
  const normalized = username.trim().toLowerCase();
  return db
    .collection('apps')
    .doc(appId)
    .collection('instagramUsers')
    .doc(normalized);
}

async function upsertInstagramUserCache(
  username: string,
  stories: InstagramStoriesResult,
  appId: string
) {
  try {
    const user = stories.reel?.user;
    if (!user?.id) {
      return;
    }

    const docRef = getInstagramUserDocRef(username, appId);
    const existing = await docRef.get();
    const existingData = existing.data() as
      | Partial<InstagramUserCache>
      | undefined;

    const cacheData: InstagramUserCache = {
      id: username,
      igUserId: user.id.toString(),
      createdAt: existingData?.createdAt || new Date(),
      updatedAt: new Date(),
      lastFetched: {
        storiesAt: new Date(),
        postsAt: existingData?.lastFetched?.postsAt,
        profileAt: existingData?.lastFetched?.profileAt
      },
      fullName: user.full_name || '',
      profilePicUrl: user.profile_pic_url || '',
      isVerified: String(Boolean(user.is_verified)),
      igUserName: user.username || username,
      isPublic: true
    };

    await docRef.set(cacheData, { merge: true });
  } catch (error) {
    logger.warn('Failed to cache instagram user mapping', {
      username,
      error: (error as Error).message
    });
  }
}

/**
 * Get Instagram user stories using HikerAPI by user ID
 * @param userId Instagram user ID
 * @param options Optional parameters (force, safe_int)
 * @returns Story data from HikerAPI
 */
export async function getStoriesUsingHikerByUserId(
  userId: string,
  options?: HikerAPIStoryOptions
): Promise<InstagramStoriesResult> {
  try {
    const apiKey = getHikerApiKey();

    logger.info('Fetching stories from HikerAPI by user ID', { userId });

    // Build query parameters
    const params: Record<string, string> = {
      user_id: userId
    };

    if (options?.force !== undefined) {
      params.force = options.force.toString();
    }

    if (options?.safe_int !== undefined) {
      params.safe_int = options.safe_int.toString();
    }

    // Make request to HikerAPI
    const response = await axios.get(`${HIKER_API_BASE_URL}/v2/user/stories`, {
      headers: {
        accept: 'application/json',
        'x-access-key': apiKey
      },
      params
    });

    logger.info('Successfully fetched stories from HikerAPI', {
      userId,
      status: response.data.status,
      itemCount: response.data.reel?.items?.length || 0
    });
    logger.info(
      'story',
      response.data.reel?.items?.[10] || 'no item at index 9'
    );

    return response.data;
  } catch (error: unknown) {
    logger.error('Failed to fetch stories from HikerAPI by user ID', {
      userId,
      error: (error as Error).message
    });
    throw new Error(
      `Failed to get stories from HikerAPI: ${(error as Error).message}`
    );
  }
}

/**
 * Get Instagram user stories using HikerAPI by username
 * @param username Instagram username
 * @param options Optional parameters (force, safe_int)
 * @returns Story data from HikerAPI
 */
export async function getStoriesByUsername(
  username: string,
  options: HikerAPIStoryOptions | undefined,
  appId: string
): Promise<InstagramStoriesResult> {
  try {
    const apiKey = getHikerApiKey();

    logger.info('Fetching stories from HikerAPI by username', { username });

    const usernameDoc = await getInstagramUserDocRef(username, appId).get();
    const cachedData = usernameDoc.data() as
      | Partial<InstagramUserCache>
      | undefined;

    if (cachedData?.igUserId) {
      try {
        logger.info('Using cached igUserId for story fetch', {
          username,
          igUserId: cachedData.igUserId
        });

        const storiesByUserId = await getStoriesUsingHikerByUserId(
          cachedData.igUserId,
          options
        );

        await upsertInstagramUserCache(username, storiesByUserId, appId);
        return storiesByUserId;
      } catch (cachedFetchError) {
        logger.warn('Cached igUserId fetch failed, falling back to username', {
          username,
          igUserId: cachedData.igUserId,
          error: (cachedFetchError as Error).message
        });
      }
    }

    // Build query parameters
    const params: Record<string, string> = {
      username: username
    };

    if (options?.force !== undefined) {
      params.force = options.force.toString();
    }

    if (options?.safe_int !== undefined) {
      params.safe_int = options.safe_int.toString();
    }

    // Make request to HikerAPI
    const response = await axios.get(
      `${HIKER_API_BASE_URL}/v2/user/stories/by/username`,
      {
        headers: {
          accept: 'application/json',
          'x-access-key': apiKey
        },
        params
      }
    );

    logger.info('Successfully fetched stories from HikerAPI', {
      username,
      status: response.data.status,
      itemCount: response.data.reel?.items?.length || 0
    });

    await upsertInstagramUserCache(username, response.data, appId);

    return response.data;
  } catch (error: unknown) {
    logger.error('Failed to fetch stories from HikerAPI by username', {
      username,
      error: (error as Error).message
    });
    throw new Error(
      `Failed to get stories from HikerAPI: ${(error as Error).message}`
    );
  }
}

/**
 * Get Instagram story by ID using HikerAPI
 * @param storyId Instagram story ID
 * @param options Optional parameters (force, safe_int)
 * @returns Story data from HikerAPI
 */
export async function getStoryById(
  storyId: string,
  options?: HikerAPIStoryOptions
): Promise<InstagramStoriesResult> {
  try {
    const apiKey = getHikerApiKey();

    logger.info('Fetching story from HikerAPI by ID', { storyId });

    // Build query parameters
    const params: Record<string, string> = {
      id: storyId
    };

    if (options?.force !== undefined) {
      params.force = options.force.toString();
    }

    if (options?.safe_int !== undefined) {
      params.safe_int = options.safe_int.toString();
    }

    // Make request to HikerAPI
    const response = await axios.get(`${HIKER_API_BASE_URL}/v2/story/by/id`, {
      headers: {
        accept: 'application/json',
        'x-access-key': apiKey
      },
      params
    });

    logger.info('Successfully fetched story from HikerAPI', {
      storyId,
      status: response.data.status
    });

    return response.data;
  } catch (error: unknown) {
    logger.error('Failed to fetch story from HikerAPI by ID', {
      storyId,
      error: (error as Error).message
    });
    throw new Error(
      `Failed to get story from HikerAPI: ${(error as Error).message}`
    );
  }
}

/**
 * Get Instagram story by URL using HikerAPI
 * Note: For /s/ links, you need to call /v1/share/by/url first to resolve the URL
 * @param url Instagram story URL
 * @param options Optional parameters (force, safe_int)
 * @returns Story data from HikerAPI
 */
export async function getStoryByUrl(
  url: string,
  options?: HikerAPIStoryOptions
): Promise<InstagramStoriesResult> {
  try {
    const apiKey = getHikerApiKey();

    logger.info('Fetching story from HikerAPI by URL', { url });

    // Build query parameters
    const params: Record<string, string> = {
      url: url
    };

    if (options?.force !== undefined) {
      params.force = options.force.toString();
    }

    if (options?.safe_int !== undefined) {
      params.safe_int = options.safe_int.toString();
    }

    // Make request to HikerAPI
    const response = await axios.get(`${HIKER_API_BASE_URL}/v2/story/by/url`, {
      headers: {
        accept: 'application/json',
        'x-access-key': apiKey
      },
      params
    });

    logger.info('Successfully fetched story from HikerAPI', {
      url,
      status: response.data.status
    });

    return response.data;
  } catch (error: unknown) {
    logger.error('Failed to fetch story from HikerAPI by URL', {
      url,
      error: (error as Error).message
    });
    throw new Error(
      `Failed to get story from HikerAPI: ${(error as Error).message}`
    );
  }
}

/**
 * Resolve Instagram share URL (/s/ links) using HikerAPI
 * This should be called before getStoryByUrlUsingHiker for /s/ links
 * @param shareUrl Instagram share URL (e.g., https://www.instagram.com/s/...)
 * @returns Resolved URL data
 */
export async function resolveShareUrl(shareUrl: string): Promise<unknown> {
  try {
    const apiKey = getHikerApiKey();

    logger.info('Resolving share URL using HikerAPI', { shareUrl });

    // Make request to HikerAPI
    const response = await axios.get(`${HIKER_API_BASE_URL}/v1/share/by/url`, {
      headers: {
        accept: 'application/json',
        'x-access-key': apiKey
      },
      params: {
        url: shareUrl
      }
    });

    logger.info('Successfully resolved share URL', {
      shareUrl,
      status: response.data.status
    });

    return response.data;
  } catch (error: unknown) {
    logger.error('Failed to resolve share URL using HikerAPI', {
      shareUrl,
      error: (error as Error).message
    });
    throw new Error(`Failed to resolve share URL: ${(error as Error).message}`);
  }
}

/**
 * Extract all media URLs from story items
 * @param items Array of story items
 * @returns Array of media URLs with type information
 */
export function extractStoryMediaUrls(items: InstagramStoryItem[]): Array<{
  url: string;
  type: 'image' | 'video';
  width: number;
  height: number;
  videoDuration?: number;
  takenAt?: string;
}> {
  const mediaUrls: Array<{
    url: string;
    type: 'image' | 'video';
    width: number;
    height: number;
    videoDuration?: number;
    takenAt?: string;
  }> = [];

  for (const item of items) {
    const takenAtDate = item.taken_at
      ? new Date(item.taken_at * 1000).toISOString()
      : undefined;

    if (item.media_type === 2 && item.video_versions) {
      // Video - get highest quality version
      const video = item.video_versions[0];
      mediaUrls.push({
        url: video.url,
        type: 'video',
        width: video.width,
        height: video.height,
        videoDuration: item.video_duration,
        takenAt: takenAtDate
      });
    } else if (item.media_type === 1 && item.image_versions2) {
      // Image - get highest quality version
      const image = item.image_versions2.candidates[0];
      mediaUrls.push({
        url: image.url,
        type: 'image',
        width: image.width,
        height: image.height,
        takenAt: takenAtDate
      });
    }
  }

  return mediaUrls;
}

// ============== Normalized Story Functions ==============

/**
 * Convert Instagram story items to normalized MediaItem format
 * @param items Array of story items
 * @param username Username for generating IDs
 * @returns Array of normalized MediaItem objects
 */
export function normalizeStoryItems(
  items: InstagramStoryItem[],
  username: string
): MediaItem[] {
  const mediaItems: MediaItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.media_type === 2 && item.video_versions) {
      // Video story
      const video = item.video_versions[0];
      const thumbnail = item.image_versions2?.candidates?.[0];

      mediaItems.push({
        id: item.id || `${username}_story_${i}`,
        type: 'video',
        url: video.url,
        thumbnailUrl: thumbnail?.url,
        width: video.width,
        height: video.height,
        duration: item.video_duration,
        expiringAt: item.expiring_at
      });
    } else if (item.media_type === 1 && item.image_versions2) {
      // Photo story
      const image = item.image_versions2.candidates[0];

      mediaItems.push({
        id: item.id || `${username}_story_${i}`,
        type: 'photo',
        url: image.url,
        width: image.width,
        height: image.height,
        expiringAt: item.expiring_at
      });
    }
  }

  return mediaItems;
}

/**
 * Get thumbnail URL from story item
 * Prioritizes image_versions2 candidates, falls back to profile_pic_url
 * @param firstItem First story item
 * @param profilePicUrl User's profile picture URL as fallback
 * @returns Thumbnail URL
 */
function getStoryThumbnailUrl(
  firstItem: InstagramStoryItem | undefined,
  profilePicUrl: string
): string | undefined {
  // Try to get thumbnail from first story item's image_versions2
  if (
    firstItem?.image_versions2?.candidates &&
    firstItem.image_versions2.candidates.length > 0
  ) {
    return firstItem.image_versions2.candidates[0].url;
  }
  // Fallback to user's profile picture
  return profilePicUrl;
}

/**
 * Build title and subtitle for stories
 * @param username Instagram username
 * @param storyCount Number of stories
 * @returns Object with title and subTitle
 */
function buildStoryTitleAndSubtitle(
  username: string,
  storyCount: number
): { title: string; subTitle: string } {
  const suffix = `Stor${storyCount !== 1 ? 'ies' : 'y'}`;
  return {
    title: `@${username} ${storyCount} ${suffix}`,
    subTitle: `${storyCount} ${suffix} available`
  };
}

/**
 * Build metadata object for story result
 * @param media Array of media items
 * @param reel Story reel data
 * @param firstItem First story item for expiring timestamp
 * @returns Metadata object
 */
function buildStoryMetadata(
  media: MediaItem[],
  reel: InstagramStoryReel | undefined,
  firstItem: InstagramStoryItem | undefined
): NormalizedStoryResult['metadata'] {
  return {
    storyCount: media.length,
    userId: reel?.id?.toString(),
    expiringAt: firstItem?.expiring_at,

    user: reel?.user
      ? {
          full_name: reel.user.full_name,
          profile_pic_url: reel.user.profile_pic_url,
          is_verified: reel.user.is_verified,
          username: reel.user.username
        }
      : undefined,

    elements: {
      mentions: extractMentions(firstItem),
      links: extractLinks(firstItem),
      music: extractMusic(firstItem)
    }
  };
}

function extractMusic(item?: InstagramStoryItem): StoryMusic[] {
  return (
    item?.story_music_stickers?.map((sticker) => ({
      id: getAutoId(),
      type: 'music',
      title: sticker.music_asset_info?.title,
      artist: sticker.music_asset_info?.display_artist,
      audio_url: sticker.music_asset_info?.progressive_download_url,
      start_time_ms: sticker.music_asset_info?.audio_asset_start_time_in_ms,
      duration_ms: sticker.music_asset_info?.overlap_duration_in_ms,
      x: sticker.x,
      y: sticker.y,
      width: sticker.width,
      height: sticker.height,
      display_type: 'music_hidden',
      is_visible: sticker.display_type !== 'music_hidden'
    })) || []
  );
}

function extractMentions(item?: InstagramStoryItem): StoryMention[] {
  return (
    item?.reel_mentions?.map((m) => ({
      id: getAutoId(),
      type: 'mention',
      username: m.user?.username,
      full_name: m.user?.full_name,
      is_verified: m.user?.is_verified,
      x: m.x,
      y: m.y,
      width: m.width,
      height: m.height,
      rotation: m.rotation,
      z: m.z
    })) || []
  );
}

function extractLinks(item?: InstagramStoryItem): StoryLink[] {
  return (
    item?.story_link_stickers?.map((sticker) => {
      const wrapped = sticker.story_link?.url;

      let decodedUrl = wrapped;

      try {
        const urlObj = new URL(wrapped);
        const encoded = urlObj.searchParams.get('u');
        if (encoded) {
          decodedUrl = decodeURIComponent(encoded);
        }
      } catch {}

      return {
        id: getAutoId(),
        type: 'link',
        url: decodedUrl,
        display_url: sticker.story_link?.display_url,
        title: sticker.story_link?.link_title,
        x: sticker.x,
        y: sticker.y,
        width: sticker.width,
        height: sticker.height
      };
    }) || []
  );
}

/**
 * Build complete normalized story result
 * @param username Instagram username
 * @param sourceUrl Source URL for the story
 * @param thumbnailUrl Thumbnail URL
 * @param media Array of media items
 * @param reel Story reel data
 * @param firstItem First story item
 * @param customTitle Optional custom title (overrides auto-generated)
 * @param customSubtitle Optional custom subtitle (overrides auto-generated)
 * @returns Complete NormalizedStoryResult
 */
function buildNormalizedStoryResult(
  username: string,
  sourceUrl: string,
  thumbnailUrl: string | undefined,
  media: MediaItem[],
  reel: InstagramStoryReel | undefined,
  firstItem: InstagramStoryItem | undefined,
  customTitle?: string,
  customSubtitle?: string
): NormalizedStoryResult {
  const titleAndSubtitle = buildStoryTitleAndSubtitle(username, media.length);

  return {
    type: SaveType.IG_STORY,
    sourceUrl,
    thumbnailUrl,
    media,
    title: customTitle || titleAndSubtitle.title,
    subTitle: customSubtitle || titleAndSubtitle.subTitle,
    metadata: buildStoryMetadata(media, reel, firstItem)
  };
}

/**
 * Get normalized Instagram stories by username
 * Returns data in SmartSave model format
 * @param username Instagram username
 * @param options Optional parameters (force, safe_int)
 * @returns Normalized story data
 */
export async function getNormalizedStoriesByUsername(
  username: string,
  options: HikerAPIStoryOptions | undefined,
  appId: string
): Promise<NormalizedStoryResult | null> {
  try {
    const storiesData = await getStoriesByUsername(username, options, appId);

    if (
      !storiesData.reel ||
      !storiesData.reel.items ||
      storiesData.reel.items.length === 0
    ) {
      logger.info('No stories found for username', { username });
      return null;
    }

    const media = normalizeStoryItems(storiesData.reel.items, username);

    // Get thumbnail from first story item or profile pic
    const thumbnailUrl = getStoryThumbnailUrl(
      storiesData.reel.items[0],
      storiesData.reel.user.profile_pic_url
    );

    return buildNormalizedStoryResult(
      username,
      `https://instagram.com/stories/${username}`,
      thumbnailUrl,
      media,
      storiesData.reel,
      storiesData.reel.items[0]
    );
  } catch (error) {
    logger.error('Failed to get normalized stories by username', {
      username,
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Get normalized Instagram stories by user ID
 * Returns data in SmartSave model format
 * @param userId Instagram user ID
 * @param options Optional parameters (force, safe_int)
 * @returns Normalized story data
 */
export async function getNormalizedStoriesByUserId(
  userId: string,
  options?: HikerAPIStoryOptions
): Promise<NormalizedStoryResult | null> {
  try {
    const storiesData = await getStoriesUsingHikerByUserId(userId, options);

    if (
      !storiesData.reel ||
      !storiesData.reel.items ||
      storiesData.reel.items.length === 0
    ) {
      logger.info('No stories found for user ID', { userId });
      return null;
    }

    const username = storiesData.reel.user.username;
    const media = normalizeStoryItems(storiesData.reel.items, username);

    // Get thumbnail from first story item or profile pic
    const thumbnailUrl = getStoryThumbnailUrl(
      storiesData.reel.items[0],
      storiesData.reel.user.profile_pic_url
    );

    return buildNormalizedStoryResult(
      username,
      `https://instagram.com/stories/${username}`,
      thumbnailUrl,
      media,
      storiesData.reel,
      storiesData.reel.items[0]
    );
  } catch (error) {
    logger.error('Failed to get normalized stories by user ID', {
      userId,
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Get normalized Instagram story by ID
 * Returns data in SmartSave model format
 * @param storyId Instagram story ID
 * @param options Optional parameters (force, safe_int)
 * @returns Normalized story data
 */
export async function getNormalizedStoryById(
  storyId: string,
  options?: HikerAPIStoryOptions
): Promise<NormalizedStoryResult | null> {
  try {
    const storyData = await getStoryById(storyId, options);

    const items = storyData.reel?.items || storyData.items || [];
    if (items.length === 0) {
      logger.info('No story items found for ID', { storyId });
      return null;
    }

    const username = storyData.reel?.user?.username || 'unknown';
    const media = normalizeStoryItems(items, username);
    const thumbnailUrl = getStoryThumbnailUrl(
      storyData.reel.items[0],
      storyData.reel.user.profile_pic_url
    );

    return buildNormalizedStoryResult(
      username,
      `https://instagram.com/stories/${username}/${storyId}`,
      thumbnailUrl,
      media,
      storyData.reel,
      items[0],
      `@${username} - Story`,
      'Story available'
    );
  } catch (error) {
    logger.error('Failed to get normalized story by ID', {
      storyId,
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Get normalized Instagram story by URL
 * Returns data in SmartSave model format
 * @param url Instagram story URL
 * @param options Optional parameters (force, safe_int)
 * @returns Normalized story data
 */
export async function getNormalizedStoryByUrl(
  url: string,
  options?: HikerAPIStoryOptions
): Promise<NormalizedStoryResult | null> {
  try {
    const storyData = await getStoryByUrl(url, options);

    const items = storyData.reel?.items || storyData.items || [];
    if (items.length === 0) {
      logger.info('No story items found for URL', { url });
      return null;
    }
    const thumbnailUrl = getStoryThumbnailUrl(
      storyData.reel.items[0],
      storyData.reel.user.profile_pic_url
    );
    const username = storyData.reel?.user?.username || 'unknown';
    const media = normalizeStoryItems(items, username);

    return buildNormalizedStoryResult(
      username,
      url,
      thumbnailUrl,
      media,
      storyData.reel,
      items[0],
      `@${username} - Story`,
      'Story available'
    );
  } catch (error) {
    logger.error('Failed to get normalized story by URL', {
      url,
      error: (error as Error).message
    });
    throw error;
  }
}

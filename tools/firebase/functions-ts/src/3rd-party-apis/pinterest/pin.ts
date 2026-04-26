import { SaveType, SearchResult } from '@workern/models';
import axios from 'axios';
import { logger } from 'firebase-functions';

// RapidAPI key for Pinterest downloader

/**
 * Pinterest pin data response from RapidAPI
 */
export interface PinterestPinData {
  success: boolean;
  type: 'image' | 'video';
  data: {
    url: string;
    width?: number;
    height?: number;
    duration?: number; // For videos in milliseconds
    thumbnail?: string;
  };
}

/**
 * Open Graph metadata
 */
interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
}

/**
 * Fetch Open Graph metadata from a URL
 */
async function fetchOpenGraphMetadata(
  url: string
): Promise<OpenGraphData | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000,
      maxRedirects: 5
    });

    const html = response.data;

    // Extract Open Graph meta tags
    const titleMatch = html.match(
      /<meta property="og:title" content="([^"]+)"/i
    ) ||
      html.match(/<title>([^<]+)<\/title>/i) || [null, 'Pinterest Pin'];
    const descriptionMatch = html.match(
      /<meta property="og:description" content="([^"]+)"/i
    ) ||
      html.match(/<meta name="description" content="([^"]+)"/i) || [null, ''];
    const imageMatch = html.match(
      /<meta property="og:image" content="([^"]+)"/i
    );

    return {
      title:
        titleMatch[1]?.replace(/&quot;/g, '"').replace(/&amp;/g, '&') ||
        undefined,
      description: descriptionMatch[1]?.substring(0, 200) || undefined,
      image: imageMatch ? imageMatch[1] : undefined
    };
  } catch (error) {
    logger.warn('Failed to fetch Open Graph metadata', {
      url,
      error: (error as Error).message
    });
    return null;
  }
}

/**
 * Fetch Pinterest pin data using RapidAPI (pinterest-video-and-image-downloader)
 * This API handles both images and videos from Pinterest pins
 * Also fetches Open Graph metadata in parallel for title and description
 * @param pinUrl - The full Pinterest pin URL
 * @param apiKey - RapidAPI key
 * @returns SearchResult with Pinterest pin data or null if fetch fails
 */
export async function getPinterestPinData(
  pinUrl: string,
  apiKey: string
): Promise<SearchResult | null> {
  try {
    logger.info('Fetching Pinterest pin data from RapidAPI', { pinUrl });

    // Fetch RapidAPI data and Open Graph data in parallel
    const [rapidResponse, ogData] = await Promise.all([
      axios.get(
        'https://pinterest-video-and-image-downloader.p.rapidapi.com/pinterest',
        {
          params: {
            url: pinUrl
          },
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host':
              'pinterest-video-and-image-downloader.p.rapidapi.com'
          },
          timeout: 10000
        }
      ),
      fetchOpenGraphMetadata(pinUrl)
    ]);

    const pinData = rapidResponse.data as PinterestPinData;

    if (!pinData.success) {
      logger.warn('RapidAPI returned unsuccessful response', {
        pinUrl,
        response: pinData
      });
      return null;
    }

    const mediaType = pinData.type === 'video' ? 'video' : 'photo';

    logger.info('Successfully fetched Pinterest pin data', {
      pinUrl,
      type: pinData.type
    });

    // Return as normalized SearchResult
    return {
      type: SaveType.PINTEREST,
      sourceUrl: pinUrl,
      media: [
        {
          id: pinUrl,
          type: mediaType,
          url: pinData.data.url,
          thumbnailUrl: pinData.data.thumbnail || pinData.data.url
        }
      ],
      thumbnailUrl: pinData.data.thumbnail || pinData.data.url,
      title: ogData?.title || 'Pinterest Pin',
      subTitle:
        ogData?.description ||
        `${mediaType === 'video' ? 'Video' : 'Image'} Pin`,
      metadata: {
        mediaType: pinData.type,
        url: pinData.data.url,
        width: pinData.data.width,
        height: pinData.data.height,
        duration: pinData.data.duration,
        thumbnail: pinData.data.thumbnail,
        ogTitle: ogData?.title,
        ogDescription: ogData?.description,
        ogImage: ogData?.image
      }
    };
  } catch (error) {
    logger.error('Failed to fetch Pinterest pin data', {
      pinUrl,
      error: (error as Error).message
    });
    return null;
  }
}

/**
 * Extract pin ID from Pinterest URL
 * Supports formats:
 * - https://pinterest.com/pin/123456789/
 * - https://www.pinterest.com/pin/123456789/
 * - https://in.pinterest.com/pin/123456789/
 * - pinterest.com/pin/123456789
 */
export function extractPinterestPinId(url: string): string | null {
  const match = url.match(/\/pin\/(\d+)/i);
  return match ? match[1] : null;
}

import { http } from './http';

/**
 * Convert username to Instagram embed URL
 */
export const getUserNameUrl = (userName: string): string | null => {
  const instaUrl = 'https://instagram.com';

  if (userName.length >= 2 && userName.length <= 30) {
    return `${instaUrl}/${userName}/embed`;
  }

  const rex =
    /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]{2,30}(?:)?/gi;
  const match = userName.match(rex);

  if (!match) return null;

  return `${match[0]}/embed`;
};

/**
 * Generate Instagram Graph API URL for fetching user media
 * Note: Requires Instagram App ID and App Secret
 */
export const getApiUrl = (
  userId: string,
  appId: string,
  appSecret: string
): string => {
  const api = 'https://graph.instagram.com';
  const accessToken = `${appId}|${appSecret}`;
  return `${api}/${userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&access_token=${accessToken}`;
};

/**
 * Generate Instagram Stories embed URL
 */
export const getStoriesUrl = (userName: string): string => {
  return `https://www.instagram.com/stories/${userName}/embed/`;
};

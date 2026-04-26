import axios from 'axios';
import { db } from '../../global';
import { InstagramPostResult, MediaItem } from './types';
import { SaveType } from '@workern/models';
import { log } from 'firebase-functions/logger';

// HikerAPI configuration
const HIKER_API_BASE_URL = 'https://api.hikerapi.com';
const HIKER_API_KEY =
  process.env.HIKER_API_KEY || '4nz29ve9zoqx654p9ux4s8s7lf1ra8wf';

async function upsertInstagramUserCacheFromPost(payload: {
  username?: string;
  userId?: string;
  fullName?: string;
  profilePicUrl?: string;
  isVerified?: boolean;
}) {
  const username = payload.username?.trim().toLowerCase();
  if (!username) {
    return;
  }

  try {
    const ref = db
      .collection('apps')
      .doc('save-nest')
      .collection('instagramUsers')
      .doc(username);

    const snap = await ref.get();
    const existing = snap.data() as
      | {
          id?: string;
          igUserId?: string;
          createdAt?: Date;
          fullName?: string;
          profilePicUrl?: string;
          isVerified?: string;
          igUserName?: string;
          isPublic?: boolean;
          lastFetched?: {
            storiesAt?: Date;
            postsAt?: Date;
            profileAt?: Date;
          };
        }
      | undefined;

    await ref.set(
      {
        id: existing?.id || username,
        igUserId: payload.userId || existing?.igUserId || '',
        createdAt: existing?.createdAt || new Date(),
        updatedAt: new Date(),
        fullName: payload.fullName || existing?.fullName || '',
        profilePicUrl: payload.profilePicUrl || existing?.profilePicUrl || '',
        isVerified: String(
          payload.isVerified ?? existing?.isVerified === 'true'
        ),
        igUserName: payload.username || existing?.igUserName || username,
        isPublic: existing?.isPublic ?? true,
        lastFetched: {
          storiesAt: existing?.lastFetched?.storiesAt,
          postsAt: new Date(),
          profileAt: existing?.lastFetched?.profileAt
        }
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Failed to upsert instagram user cache from post', error);
  }
}

// ============== Interfaces ==============

/**
 * Fetches Instagram post/reel data using HikerAPI and returns in normalized SmartSave format
 * @param postUrl Instagram post/reel URL
 * @returns Normalized post data matching SmartSave model
 */
export async function getInstagramPostUsingHiker(
  postUrl: string
): Promise<InstagramPostResult | null> {
  try {
    console.log('🔍 Fetching Instagram post from HikerAPI:', postUrl);

    const response = await axios.get(
      `${HIKER_API_BASE_URL}/v2/media/info/by/url`,
      {
        params: {
          url: postUrl
        },
        headers: {
          'x-access-key': HIKER_API_KEY
        }
      }
    );

    console.log(
      '📦 HikerAPI Response:',
      JSON.stringify(response.data, null, 2)
    );

    if (response.data && response.data.media_or_ad) {
      const media = response.data.media_or_ad;
      const isCarousel = media.media_type === 8;
      const mediaItems: MediaItem[] = [];

      // Handle carousel
      if (isCarousel && media.carousel_media) {
        for (let i = 0; i < media.carousel_media.length; i++) {
          const carouselItem = media.carousel_media[i];
          if (
            carouselItem.video_versions &&
            carouselItem.video_versions.length > 0
          ) {
            const video = carouselItem.video_versions[0];
            mediaItems.push({
              id: carouselItem.id || `carousel_${i}`,
              type: 'video',
              url: video.url,
              thumbnailUrl: carouselItem.image_versions2?.candidates?.[0]?.url,
              width: video.width,
              height: video.height,
              duration: carouselItem.video_duration
            });
          } else if (carouselItem.image_versions2?.candidates?.[0]) {
            const image = carouselItem.image_versions2.candidates[0];
            mediaItems.push({
              id: carouselItem.id || `carousel_${i}`,
              type: 'photo',
              url: image.url,
              width: image.width,
              height: image.height
            });
          }
        }
      }
      // Handle single video
      else if (media.video_versions && media.video_versions.length > 0) {
        const video = media.video_versions[0];
        mediaItems.push({
          id: media.id || media.pk,
          type: 'video',
          url: video.url,
          thumbnailUrl: media.image_versions2?.candidates?.[0]?.url,
          width: video.width,
          height: video.height,
          duration: media.video_duration
        });
      }
      // Handle single image
      else if (media.image_versions2?.candidates?.[0]) {
        const image = media.image_versions2.candidates[0];
        mediaItems.push({
          id: media.id || media.pk,
          type: 'photo',
          url: image.url,
          width: image.width,
          height: image.height
        });
      }

      const result: InstagramPostResult = {
        type: SaveType.IG_POST,
        sourceUrl: postUrl,
        thumbnailUrl: media.image_versions2?.candidates?.[0]?.url,
        title: `@${media.user?.username || 'unknown'} - Post`,
        subTitle: media.caption?.text?.substring(0, 100) || 'Instagram Post',
        media: mediaItems,
        metadata: {
          postId: media.id || media.pk,
          likes: media.like_count,
          comments: media.comment_count,
          isCarousel: isCarousel,
          carouselCount: isCarousel ? media.carousel_media_count : undefined,
          caption: media.caption?.text,
          username: media.user?.username
        }
      };

      await upsertInstagramUserCacheFromPost({
        username: media.user?.username,
        userId: (media.user?.id || media.user?.pk || '').toString(),
        fullName: media.user?.full_name,
        profilePicUrl: media.user?.profile_pic_url,
        isVerified: media.user?.is_verified
      });

      console.log('✅ Normalized Post Data:', JSON.stringify(result, null, 2));
      return result;
    }

    console.log(
      '⚠️ No media found in HikerAPI response (media_or_ad field missing)'
    );
    return null;
  } catch (error) {
    console.error('❌ HikerAPI Error:', error);
    throw new Error(
      `Failed to fetch Instagram post: ${(error as Error).message}`
    );
  }
}

/**
 * Resolves an Instagram username to a numeric user_id.
 * First checks the Firestore cache; if not found, calls HikerAPI user info endpoint.
 */
async function resolveInstagramUserId(
  username: string
): Promise<string | null> {
  const normalized = username.trim().toLowerCase();
  const docRef = db
    .collection('apps')
    .doc('save-nest')
    .collection('instagramUsers')
    .doc(normalized);

  const snap = await docRef.get();
  const cached = snap.data() as { igUserId?: string } | undefined;
  if (cached?.igUserId) {
    return cached.igUserId;
  }

  try {
    const infoRes = await axios.get(
      `${HIKER_API_BASE_URL}/v2/user/by/username`,
      {
        params: { username: normalized },
        headers: { 'x-access-key': HIKER_API_KEY }
      }
    );
    const user = infoRes.data?.user;
    const userId = String(user?.id || user?.pk || '');
    if (userId) {
      await upsertInstagramUserCacheFromPost({
        username: user?.username ?? normalized,
        userId,
        fullName: user?.full_name,
        profilePicUrl:
          user?.hd_profile_pic_url_info?.url ?? user?.profile_pic_url,
        isVerified: user?.is_verified
      });
      return userId;
    }
  } catch (e) {
    console.warn(`⚠️ Could not resolve user_id for @${username}`, e);
  }
  return null;
}

/**
 * Fetches a user's recent Instagram posts by username using HikerAPI
 * @param username Instagram username
 * @returns Array of normalized post results
 */
export async function getInstagramPostsByUsername(
  username: string
): Promise<InstagramPostResult[]> {
  try {
    console.log('🔍 Fetching Instagram posts by username:', username);

    const userId = await resolveInstagramUserId(username);
    if (!userId) {
      console.warn(
        `⚠️ No user_id resolved for @${username}, skipping post fetch`
      );
      return [];
    }

    const response = await axios.get(`${HIKER_API_BASE_URL}/gql/user/medias`, {
      params: { user_id: userId, flat: true },
      headers: { 'x-access-key': HIKER_API_KEY }
    });

    const data = response.data as Record<string, unknown>;
    const items: Record<string, unknown>[] =
      (data['items'] as Record<string, unknown>[] | undefined) ?? [];

    // Cache user info from the top-level user field if present
    const responseUser = data['user'] as Record<string, unknown> | undefined;
    if (responseUser) {
      await upsertInstagramUserCacheFromPost({
        username: responseUser['username'] as string | undefined,
        userId: String(responseUser['id'] || responseUser['pk'] || ''),
        fullName: responseUser['full_name'] as string | undefined,
        profilePicUrl: responseUser['profile_pic_url'] as string | undefined,
        isVerified: responseUser['is_verified'] as boolean | undefined
      });
    }

    console.log(
      `📦 HikerAPI /gql/user/medias: ${items.length} items for @${username}`
    );
    const results: InstagramPostResult[] = [];

    for (const media of items) {
      const isCarousel = media['media_type'] === 8;
      const mediaItems: MediaItem[] = [];
      const carouselMedia =
        (isCarousel
          ? (media['carousel_media'] as Record<string, unknown>[])
          : []) ?? [];

      if (isCarousel && carouselMedia.length > 0) {
        for (let i = 0; i < carouselMedia.length; i++) {
          const carouselItem = carouselMedia[i];
          const videoVersions = carouselItem['video_versions'] as
            | Record<string, unknown>[]
            | undefined;
          const imageVersions = carouselItem['image_versions2'] as
            | Record<string, unknown>
            | undefined;
          if (videoVersions && videoVersions.length > 0) {
            const video = videoVersions[0];
            mediaItems.push({
              id: (carouselItem['id'] as string) || `${username}_carousel_${i}`,
              type: 'video',
              url: video['url'] as string,
              thumbnailUrl: (
                imageVersions?.['candidates'] as Record<string, unknown>[]
              )?.[0]?.['url'] as string | undefined,
              width: video['width'] as number | undefined,
              height: video['height'] as number | undefined,
              duration: (carouselItem['1fvideo_duration'] ??
                carouselItem['video_duration']) as number | undefined
            });
          } else if (imageVersions) {
            const image = (
              imageVersions['candidates'] as Record<string, unknown>[]
            )?.[0];
            if (image) {
              mediaItems.push({
                id:
                  (carouselItem['id'] as string) || `${username}_carousel_${i}`,
                type: 'photo',
                url: image['url'] as string,
                width: image['width'] as number | undefined,
                height: image['height'] as number | undefined
              });
            }
          }
        }
      } else {
        const videoVersions = media['video_versions'] as
          | Record<string, unknown>[]
          | undefined;
        const imageVersions = media['image_versions2'] as
          | Record<string, unknown>
          | undefined;

        if (videoVersions && videoVersions.length > 0) {
          const video = videoVersions[0];
          mediaItems.push({
            id: (media['id'] as string) || (media['pk'] as string),
            type: 'video',
            url: video['url'] as string,
            thumbnailUrl: (
              imageVersions?.['candidates'] as Record<string, unknown>[]
            )?.[0]?.['url'] as string | undefined,
            width: video['width'] as number | undefined,
            height: video['height'] as number | undefined,
            duration: (media['1fvideo_duration'] ?? media['video_duration']) as
              | number
              | undefined
          });
        } else if (imageVersions) {
          const image = (
            imageVersions['candidates'] as Record<string, unknown>[]
          )?.[0];
          if (image) {
            mediaItems.push({
              id: (media['id'] as string) || (media['pk'] as string),
              type: 'photo',
              url: image['url'] as string,
              width: image['width'] as number | undefined,
              height: image['height'] as number | undefined
            });
          }
        }
      }

      if (mediaItems.length === 0) continue;

      const code = media['code'] as string | undefined;
      const postUrl = code
        ? `https://www.instagram.com/p/${code}/`
        : `https://www.instagram.com/${username}/`;

      const imageVersions = media['image_versions2'] as
        | Record<string, unknown>
        | undefined;
      const thumbnailUrl = (
        imageVersions?.['candidates'] as Record<string, unknown>[]
      )?.[0]?.['url'] as string | undefined;

      const captionObj = media['caption'] as
        | Record<string, unknown>
        | null
        | undefined;

      results.push({
        type: SaveType.IG_POST,
        sourceUrl: postUrl,
        thumbnailUrl,
        title: `@${username} - Post`,
        subTitle:
          (captionObj?.['text'] as string | undefined)?.substring(0, 100) ||
          'Instagram Post',
        media: mediaItems,
        metadata: {
          postId: (media['id'] as string) || (media['pk'] as string),
          likes: media['like_count'] as number | undefined,
          comments: media['comment_count'] as number | undefined,
          isCarousel,
          carouselCount: isCarousel
            ? (media['carousel_media_count'] as number | undefined)
            : undefined,
          caption: captionObj?.['text'] as string | undefined,
          username,
          takenAt: (media['1ltaken_at'] ?? media['taken_at']) as
            | number
            | undefined
        }
      });
    }

    console.log(`✅ Fetched ${results.length} posts for @${username}`);
    return results;
  } catch (error) {
    console.error(
      `❌ Failed to fetch Instagram posts for @${username}:`,
      error
    );
    return [];
  }
}

/**
 * Normalize Instagram URL to standard format
 */
export const getInstaUrl = (url: string, isEmbed = false): string | null => {
  const instaUrl = 'https://www.instagram.com/p';

  if (url.length === 11) {
    return `${instaUrl}/${url}`;
  }

  if (isEmbed) {
    const code = url.split('/');
    return `${instaUrl}/${code[code.length - 1]}/embed/captioned/`;
  }

  const rex = [
    /(https?:\/\/(?:www\.)?instagram\.com\/(p|tv|reel|reels|reels\/videos)\/([^/?#&]+))/g,
    /(https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9-_.]+)\/(p|tv|reel)\/([^/?#&]+))/gm
  ];

  const urlMatch = url.match(rex[0]) || url.match(rex[1]);

  if (!urlMatch) return null;

  const code = urlMatch[0].split('/');
  return `${instaUrl}/${code[code.length - 1]}`;
};

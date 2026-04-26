import { writeFile } from 'node:fs/promises';
import {
  fetchReleases,
  getLatestRelease,
  downloadRelease,
  getAssetUrl,
  GitHubRateLimitError,
  GitHubDownloadError,
} from './github.js';
import type { Release } from '../types/index.js';

jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn(),
}));

const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;

const buildResponse = (
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response => {
  const headerMap = new Map(Object.entries(headers));
  return {
    status,
    statusText: status === 200 ? 'OK' : String(status),
    ok: status >= 200 && status < 300,
    headers: {
      get: (key: string) => headerMap.get(key) ?? null,
    },
    json: jest.fn().mockResolvedValue(body),
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(4)),
  } as unknown as Response;
};

const buildRelease = (overrides: Partial<Release> = {}): Release => ({
  id: 1,
  tag_name: 'v1.0.0',
  name: 'Release 1.0.0',
  body: '',
  published_at: '2024-01-01T00:00:00Z',
  assets: [],
  ...overrides,
});

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// fetchReleases
// ---------------------------------------------------------------------------
describe('fetchReleases', () => {
  it('returns parsed releases on a successful response', async () => {
    const releases = [buildRelease({ id: 1 }), buildRelease({ id: 2, tag_name: 'v2.0.0' })];
    mockFetch.mockResolvedValueOnce(buildResponse(200, releases));

    const result = await fetchReleases();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/nextlevelbuilder/ui-ux-pro-max-skill/releases',
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': 'uipro-cli' }),
      }),
    );
    expect(result).toEqual(releases);
  });

  it('throws GitHubDownloadError when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(404, null));

    await expect(fetchReleases()).rejects.toThrow(GitHubDownloadError);
    await expect(fetchReleases()).rejects.toThrow('Failed to fetch releases: 404');
  });

  it('throws GitHubRateLimitError on 403 with zero remaining', async () => {
    mockFetch.mockResolvedValueOnce(
      buildResponse(403, null, {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '9999999999',
      }),
    );

    await expect(fetchReleases()).rejects.toThrow(GitHubRateLimitError);
    await expect(fetchReleases()).rejects.toThrow('GitHub API rate limit exceeded');
  });

  it('throws GitHubRateLimitError on 429', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(429, null));

    await expect(fetchReleases()).rejects.toThrow(GitHubRateLimitError);
    await expect(fetchReleases()).rejects.toThrow('429 Too Many Requests');
  });

  it('does NOT throw on 403 when rate limit remaining is not zero', async () => {
    const releases = [buildRelease()];
    // status 403 but remaining is still present – should not hit rate limit branch,
    // but response.ok is false so GitHubDownloadError is expected instead
    mockFetch.mockResolvedValueOnce(
      buildResponse(403, null, { 'x-ratelimit-remaining': '5' }),
    );

    await expect(fetchReleases()).rejects.toThrow(GitHubDownloadError);
  });
});

// ---------------------------------------------------------------------------
// getLatestRelease
// ---------------------------------------------------------------------------
describe('getLatestRelease', () => {
  it('returns the latest release on success', async () => {
    const release = buildRelease();
    mockFetch.mockResolvedValueOnce(buildResponse(200, release));

    const result = await getLatestRelease();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/nextlevelbuilder/ui-ux-pro-max-skill/releases/latest',
      expect.any(Object),
    );
    expect(result).toEqual(release);
  });

  it('throws GitHubDownloadError on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(500, null));

    await expect(getLatestRelease()).rejects.toThrow(GitHubDownloadError);
    await expect(getLatestRelease()).rejects.toThrow('Failed to fetch latest release: 500');
  });

  it('throws GitHubRateLimitError on 429', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(429, null));

    await expect(getLatestRelease()).rejects.toThrow(GitHubRateLimitError);
  });
});

// ---------------------------------------------------------------------------
// downloadRelease
// ---------------------------------------------------------------------------
describe('downloadRelease', () => {
  it('fetches the URL and writes the file on success', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(200, null));
    mockWriteFile.mockResolvedValueOnce(undefined);

    await downloadRelease('https://example.com/asset.zip', '/tmp/asset.zip');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/asset.zip',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Accept': 'application/octet-stream' }),
      }),
    );
    expect(mockWriteFile).toHaveBeenCalledWith('/tmp/asset.zip', expect.any(Buffer));
  });

  it('throws GitHubDownloadError when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(403, null));

    await expect(
      downloadRelease('https://example.com/asset.zip', '/tmp/asset.zip'),
    ).rejects.toThrow(GitHubDownloadError);
    await expect(
      downloadRelease('https://example.com/asset.zip', '/tmp/asset.zip'),
    ).rejects.toThrow('Failed to download: 403');
  });

  it('throws GitHubRateLimitError on 429', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(429, null));

    await expect(
      downloadRelease('https://example.com/asset.zip', '/tmp/asset.zip'),
    ).rejects.toThrow(GitHubRateLimitError);
  });

  it('propagates writeFile errors', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(200, null));
    mockWriteFile.mockRejectedValueOnce(new Error('disk full'));

    await expect(
      downloadRelease('https://example.com/asset.zip', '/tmp/asset.zip'),
    ).rejects.toThrow('disk full');
  });
});

// ---------------------------------------------------------------------------
// getAssetUrl
// ---------------------------------------------------------------------------
describe('getAssetUrl', () => {
  it('returns the browser_download_url of the first ZIP asset', () => {
    const release = buildRelease({
      assets: [
        { name: 'release.zip', browser_download_url: 'https://example.com/release.zip' },
        { name: 'release.tar.gz', browser_download_url: 'https://example.com/release.tar.gz' },
      ],
    });

    expect(getAssetUrl(release)).toBe('https://example.com/release.zip');
  });

  it('falls back to the auto-generated archive URL when there are no ZIP assets', () => {
    const release = buildRelease({
      tag_name: 'v3.1.4',
      assets: [{ name: 'checksums.txt', browser_download_url: 'https://example.com/checksums.txt' }],
    });

    expect(getAssetUrl(release)).toBe(
      'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/archive/refs/tags/v3.1.4.zip',
    );
  });

  it('returns null when there are no assets and no tag_name', () => {
    const release = buildRelease({ tag_name: '', assets: [] });

    expect(getAssetUrl(release)).toBeNull();
  });

  it('returns null when assets array is empty and tag_name is missing', () => {
    const release = buildRelease({ tag_name: undefined as unknown as string, assets: [] });

    expect(getAssetUrl(release)).toBeNull();
  });

  it('uses the auto-generated URL when a ZIP asset has no browser_download_url', () => {
    const release = buildRelease({
      tag_name: 'v2.0.0',
      assets: [{ name: 'release.zip', browser_download_url: '' }],
    });

    expect(getAssetUrl(release)).toBe(
      'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/archive/refs/tags/v2.0.0.zip',
    );
  });
});
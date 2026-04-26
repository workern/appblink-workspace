import { jest } from '@jest/globals';

jest.mock('chalk', () => ({
  default: {
    cyan: (s: string) => s,
    green: (s: string) => s,
    bold: (s: string) => s,
    dim: (s: string) => s,
  },
}));

jest.mock('ora', () => {
  const spinner = {
    text: '',
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
  };
  return { default: jest.fn(() => spinner) };
});

jest.mock('prompts', () => ({ default: jest.fn() }));

jest.mock('../types/index.js', () => ({
  AI_TYPES: ['cursor', 'windsurf', 'copilot', 'all'],
}));

jest.mock('../utils/extract.js', () => ({
  copyFolders: jest.fn(),
  installFromZip: jest.fn(),
  createTempDir: jest.fn(),
  cleanup: jest.fn(),
}));

jest.mock('../utils/template.js', () => ({
  generatePlatformFiles: jest.fn(),
  generateAllPlatformFiles: jest.fn(),
}));

jest.mock('../utils/detect.js', () => ({
  detectAIType: jest.fn(),
  getAITypeDescription: jest.fn((t: string) => `AI:${t}`),
}));

jest.mock('../utils/logger.js', () => ({
  logger: {
    title: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('../utils/github.js', () => {
  class GitHubRateLimitError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'GitHubRateLimitError';
    }
  }
  class GitHubDownloadError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'GitHubDownloadError';
    }
  }
  return {
    getLatestRelease: jest.fn(),
    getAssetUrl: jest.fn(),
    downloadRelease: jest.fn(),
    GitHubRateLimitError,
    GitHubDownloadError,
  };
});

import prompts from 'prompts';
import { generatePlatformFiles, generateAllPlatformFiles } from '../utils/template.js';
import { copyFolders } from '../utils/extract.js';
import { detectAIType } from '../utils/detect.js';
import { logger } from '../utils/logger.js';
import {
  getLatestRelease,
  getAssetUrl,
  downloadRelease,
  GitHubRateLimitError,
  GitHubDownloadError,
} from '../utils/github.js';
import { initCommand } from './init.js';

const mockGeneratePlatformFiles = generatePlatformFiles as jest.MockedFunction<typeof generatePlatformFiles>;
const mockGenerateAllPlatformFiles = generateAllPlatformFiles as jest.MockedFunction<typeof generateAllPlatformFiles>;
const mockCopyFolders = copyFolders as jest.MockedFunction<typeof copyFolders>;
const mockDetectAIType = detectAIType as jest.MockedFunction<typeof detectAIType>;
const mockPrompts = prompts as jest.MockedFunction<typeof prompts>;
const mockGetLatestRelease = getLatestRelease as jest.MockedFunction<typeof getLatestRelease>;
const mockGetAssetUrl = getAssetUrl as jest.MockedFunction<typeof getAssetUrl>;
const mockDownloadRelease = downloadRelease as jest.MockedFunction<typeof downloadRelease>;

const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

beforeEach(() => {
  jest.clearAllMocks();
  mockDetectAIType.mockReturnValue({ detected: [], suggested: null });
});

afterAll(() => {
  mockProcessExit.mockRestore();
  mockConsoleLog.mockRestore();
});

describe('initCommand', () => {
  describe('default template-based install', () => {
    it('generates platform files when ai option is provided', async () => {
      mockGeneratePlatformFiles.mockResolvedValue(['cursor/skills']);

      await initCommand({ ai: 'cursor' });

      expect(mockGeneratePlatformFiles).toHaveBeenCalledWith(process.cwd(), 'cursor');
      expect(logger.success).toHaveBeenCalledWith('UI/UX Pro Max installed successfully!');
    });

    it('calls generateAllPlatformFiles when ai is "all"', async () => {
      mockGenerateAllPlatformFiles.mockResolvedValue(['cursor/skills', 'windsurf/skills']);

      await initCommand({ ai: 'all' });

      expect(mockGenerateAllPlatformFiles).toHaveBeenCalledWith(process.cwd());
      expect(mockGeneratePlatformFiles).not.toHaveBeenCalled();
    });

    it('logs each copied folder to console', async () => {
      mockGeneratePlatformFiles.mockResolvedValue(['folderA', 'folderB']);

      await initCommand({ ai: 'cursor' });

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('folderA'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('folderB'));
    });
  });

  describe('prompt flow when no ai option provided', () => {
    it('prompts user and uses selected ai type', async () => {
      mockGeneratePlatformFiles.mockResolvedValue(['windsurf/skills']);
      (mockPrompts as jest.Mock).mockResolvedValue({ aiType: 'windsurf' });

      await initCommand({});

      expect(mockPrompts).toHaveBeenCalled();
      expect(mockGeneratePlatformFiles).toHaveBeenCalledWith(process.cwd(), 'windsurf');
    });

    it('cancels installation when user does not select an ai type', async () => {
      (mockPrompts as jest.Mock).mockResolvedValue({ aiType: undefined });

      await initCommand({});

      expect(logger.warn).toHaveBeenCalledWith('Installation cancelled');
      expect(mockGeneratePlatformFiles).not.toHaveBeenCalled();
    });

    it('shows detected AI types in info log', async () => {
      mockDetectAIType.mockReturnValue({ detected: ['cursor'], suggested: 'cursor' });
      (mockPrompts as jest.Mock).mockResolvedValue({ aiType: 'cursor' });
      mockGeneratePlatformFiles.mockResolvedValue([]);

      await initCommand({});

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('cursor'));
    });
  });

  describe('legacy ZIP-based install', () => {
    it('installs from GitHub when legacy flag is set and network is available', async () => {
      const fakeRelease = { tag_name: 'v1.0.0', assets: [] };
      mockGetLatestRelease.mockResolvedValue(fakeRelease as any);
      mockGetAssetUrl.mockReturnValue('https://example.com/release.zip');
      mockDownloadRelease.mockResolvedValue(undefined);

      const { installFromZip, createTempDir, cleanup } = await import('../utils/extract.js');
      (createTempDir as jest.Mock).mockResolvedValue('/tmp/test-dir');
      (installFromZip as jest.Mock).mockResolvedValue({
        copiedFolders: ['cursor/skills'],
        tempDir: '/tmp/extracted',
      });
      (cleanup as jest.Mock).mockResolvedValue(undefined);

      await initCommand({ ai: 'cursor', legacy: true });

      expect(mockGetLatestRelease).toHaveBeenCalled();
      expect(logger.success).toHaveBeenCalledWith('UI/UX Pro Max installed successfully!');
    });

    it('falls back to bundled assets when offline mode is set', async () => {
      mockCopyFolders.mockResolvedValue(['cursor/bundled']);

      await initCommand({ ai: 'cursor', legacy: true, offline: true });

      expect(mockGetLatestRelease).not.toHaveBeenCalled();
      expect(mockCopyFolders).toHaveBeenCalled();
      expect(logger.success).toHaveBeenCalledWith('UI/UX Pro Max installed successfully!');
    });

    it('falls back to bundled assets when GitHub download fails', async () => {
      mockGetLatestRelease.mockRejectedValue(new (GitHubDownloadError as any)('Download failed'));
      mockCopyFolders.mockResolvedValue(['cursor/bundled']);

      await initCommand({ ai: 'cursor', legacy: true });

      expect(mockCopyFolders).toHaveBeenCalled();
      expect(logger.success).toHaveBeenCalledWith('UI/UX Pro Max installed successfully!');
    });

    it('falls back to bundled assets when GitHub rate limit is hit', async () => {
      mockGetLatestRelease.mockRejectedValue(new (GitHubRateLimitError as any)('Rate limited'));
      mockCopyFolders.mockResolvedValue(['cursor/bundled']);

      await initCommand({ ai: 'cursor', legacy: true });

      expect(mockCopyFolders).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('calls spinner.fail and process.exit(1) when template generation throws', async () => {
      mockGeneratePlatformFiles.mockRejectedValue(new Error('Template error'));

      await initCommand({ ai: 'cursor' });

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(logger.error).toHaveBeenCalledWith('Template error');
    });

    it('calls spinner.fail and process.exit(1) when bundled install throws', async () => {
      mockCopyFolders.mockRejectedValue(new Error('Copy failed'));

      await initCommand({ ai: 'cursor', legacy: true, offline: true });

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(logger.error).toHaveBeenCalledWith('Copy failed');
    });

    it('handles non-Error thrown objects gracefully', async () => {
      mockGeneratePlatformFiles.mockRejectedValue('string error');

      await initCommand({ ai: 'cursor' });

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
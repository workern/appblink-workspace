import { versionsCommand } from './versions';

jest.mock('chalk', () => ({
  bold: (s: string) => s,
  green: (s: string) => s,
  dim: (s: string) => s,
}));

const mockSpinner = {
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  warn: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
};

jest.mock('ora', () => jest.fn(() => mockSpinner));

jest.mock('../utils/github.js', () => ({
  fetchReleases: jest.fn(),
}));

jest.mock('../utils/logger.js', () => ({
  logger: {
    dim: jest.fn(),
    error: jest.fn(),
  },
}));

import { fetchReleases } from '../utils/github.js';
import { logger } from '../utils/logger.js';

const mockFetchReleases = fetchReleases as jest.MockedFunction<typeof fetchReleases>;

describe('versionsCommand', () => {
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as (code?: number) => never);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should display releases when multiple versions are returned', async () => {
    const releases = [
      { tag_name: 'v2.0.0', published_at: '2024-06-01T00:00:00Z' },
      { tag_name: 'v1.0.0', published_at: '2024-01-01T00:00:00Z' },
    ];
    mockFetchReleases.mockResolvedValue(releases as any);

    await versionsCommand();

    expect(mockSpinner.succeed).toHaveBeenCalledWith('Found 2 version(s)\n');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Available versions:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('v2.0.0'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('v1.0.0'));
    expect(logger.dim).toHaveBeenCalledWith(
      'Use: uipro init --version <tag> to install a specific version'
    );
  });

  it('should mark the first release as latest', async () => {
    const releases = [
      { tag_name: 'v3.0.0', published_at: '2024-09-01T00:00:00Z' },
      { tag_name: 'v2.0.0', published_at: '2024-06-01T00:00:00Z' },
    ];
    mockFetchReleases.mockResolvedValue(releases as any);

    await versionsCommand();

    const latestCall = consoleLogSpy.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('[latest]')
    );
    expect(latestCall).toBeDefined();
    expect(latestCall![0]).toContain('v3.0.0');

    const nonLatestCall = consoleLogSpy.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('v2.0.0')
    );
    expect(nonLatestCall).toBeDefined();
    expect(nonLatestCall![0]).not.toContain('[latest]');
  });

  it('should warn when no releases are found', async () => {
    mockFetchReleases.mockResolvedValue([]);

    await versionsCommand();

    expect(mockSpinner.warn).toHaveBeenCalledWith('No releases found');
    expect(mockSpinner.succeed).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should handle a single release correctly', async () => {
    const releases = [{ tag_name: 'v1.0.0', published_at: '2024-01-15T00:00:00Z' }];
    mockFetchReleases.mockResolvedValue(releases as any);

    await versionsCommand();

    expect(mockSpinner.succeed).toHaveBeenCalledWith('Found 1 version(s)\n');
    const latestCall = consoleLogSpy.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('[latest]')
    );
    expect(latestCall).toBeDefined();
    expect(latestCall![0]).toContain('v1.0.0');
  });

  it('should fail gracefully and exit on fetch error', async () => {
    const error = new Error('Network failure');
    mockFetchReleases.mockRejectedValue(error);

    await versionsCommand();

    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to fetch versions');
    expect(logger.error).toHaveBeenCalledWith('Network failure');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should not call logger.error for non-Error thrown values', async () => {
    mockFetchReleases.mockRejectedValue('some string error');

    await versionsCommand();

    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to fetch versions');
    expect(logger.error).not.toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
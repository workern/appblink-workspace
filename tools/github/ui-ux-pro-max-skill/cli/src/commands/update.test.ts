import { updateCommand } from './update';

jest.mock('chalk', () => ({
  cyan: (str: string) => str,
}));

const mockSpinner = {
  succeed: jest.fn(),
  fail: jest.fn(),
};

jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnValue(mockSpinner),
  }));
});

jest.mock('../utils/github.js', () => ({
  getLatestRelease: jest.fn(),
}));

jest.mock('../utils/logger.js', () => ({
  logger: {
    title: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('./init.js', () => ({
  initCommand: jest.fn(),
}));

import { getLatestRelease } from '../utils/github.js';
import { logger } from '../utils/logger.js';
import { initCommand } from './init.js';

const mockGetLatestRelease = getLatestRelease as jest.MockedFunction<typeof getLatestRelease>;
const mockInitCommand = initCommand as jest.MockedFunction<typeof initCommand>;

describe('updateCommand', () => {
  const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    processExitSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should display title, fetch latest release, and call initCommand with force: true', async () => {
    mockGetLatestRelease.mockResolvedValueOnce({ tag_name: 'v1.2.3' } as any);
    mockInitCommand.mockResolvedValueOnce(undefined);

    await updateCommand({ ai: 'openai' as any });

    expect(logger.title).toHaveBeenCalledWith('UI/UX Pro Max Updater');
    expect(mockGetLatestRelease).toHaveBeenCalledTimes(1);
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Latest version: v1.2.3');
    expect(logger.info).toHaveBeenCalledWith('Running update (same as init with latest version)...');
    expect(mockInitCommand).toHaveBeenCalledWith({ ai: 'openai', force: true });
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should call initCommand without ai when options.ai is undefined', async () => {
    mockGetLatestRelease.mockResolvedValueOnce({ tag_name: 'v2.0.0' } as any);
    mockInitCommand.mockResolvedValueOnce(undefined);

    await updateCommand({});

    expect(mockInitCommand).toHaveBeenCalledWith({ ai: undefined, force: true });
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should call spinner.fail and logger.error and exit(1) when getLatestRelease throws an Error', async () => {
    const testError = new Error('Network failure');
    mockGetLatestRelease.mockRejectedValueOnce(testError);

    await updateCommand({ ai: 'openai' as any });

    expect(mockSpinner.fail).toHaveBeenCalledWith('Update check failed');
    expect(logger.error).toHaveBeenCalledWith('Network failure');
    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(mockInitCommand).not.toHaveBeenCalled();
  });

  it('should call spinner.fail and exit(1) but not logger.error when a non-Error is thrown', async () => {
    mockGetLatestRelease.mockRejectedValueOnce('some string error');

    await updateCommand({});

    expect(mockSpinner.fail).toHaveBeenCalledWith('Update check failed');
    expect(logger.error).not.toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should call spinner.fail and exit(1) when initCommand throws', async () => {
    mockGetLatestRelease.mockResolvedValueOnce({ tag_name: 'v3.0.0' } as any);
    mockInitCommand.mockRejectedValueOnce(new Error('init failed'));

    await updateCommand({ ai: 'openai' as any });

    expect(mockSpinner.fail).toHaveBeenCalledWith('Update check failed');
    expect(logger.error).toHaveBeenCalledWith('init failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
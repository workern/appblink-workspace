typescript
import { mkdir, rm, access, cp, mkdtemp, readdir } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

jest.mock('node:fs/promises');
jest.mock('node:child_process');
jest.mock('node:util', () => ({
  promisify: (fn: unknown) => fn,
}));
jest.mock('node:os');
jest.mock('../types/index.js', () => ({
  AI_FOLDERS: {
    cursor: ['.cursor', '.shared'],
    windsurf: ['.windsurf', '.shared'],
    copilot: ['.copilot', '.shared'],
  },
}));

const mockedMkdir = mkdir as jest.MockedFunction<typeof mkdir>;
const mockedRm = rm as jest.MockedFunction<typeof rm>;
const mockedAccess = access as jest.MockedFunction<typeof access>;
const mockedCp = cp as jest.MockedFunction<typeof cp>;
const mockedMkdtemp = mkdtemp as jest.MockedFunction<typeof mkdtemp>;
const mockedReaddir = readdir as jest.MockedFunction<typeof readdir>;
const mockedExec = exec as jest.MockedFunction<typeof exec>;
const mockedTmpdir = tmpdir as jest.MockedFunction<typeof tmpdir>;

import {
  extractZip,
  copyFolders,
  cleanup,
  createTempDir,
  installFromZip,
} from './extract';

describe('extractZip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call unzip on non-Windows platforms', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', writable: true });
    mockedExec.mockImplementation((_cmd: string, callback: any) => {
      callback(null, { stdout: '', stderr: '' });
      return {} as any;
    });

    await extractZip('/path/to/file.zip', '/dest/dir');

    expect(mockedExec).toHaveBeenCalledWith(
      'unzip -o "/path/to/file.zip" -d "/dest/dir"',
      expect.any(Function)
    );
  });

  it('should call powershell Expand-Archive on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32', writable: true });
    mockedExec.mockImplementation((_cmd: string, callback: any) => {
      callback(null, { stdout: '', stderr: '' });
      return {} as any;
    });

    await extractZip('C:\\file.zip', 'C:\\dest');

    expect(mockedExec).toHaveBeenCalledWith(
      expect.stringContaining('Expand-Archive'),
      expect.any(Function)
    );
  });

  it('should throw an error when exec fails', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', writable: true });
    mockedExec.mockImplementation((_cmd: string, callback: any) => {
      callback(new Error('unzip not found'), null);
      return {} as any;
    });

    await expect(extractZip('/path/to/file.zip', '/dest')).rejects.toThrow(
      'Failed to extract zip'
    );
  });
});

describe('copyFolders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process, 'platform', { value: 'linux', writable: true });
  });

  it('should copy folders that exist in the source directory', async () => {
    mockedAccess.mockResolvedValue(undefined);
    mockedMkdir.mockResolvedValue(undefined as any);
    mockedCp.mockResolvedValue(undefined);

    const result = await copyFolders('/source', '/target', 'cursor');

    expect(mockedCp).toHaveBeenCalled();
    expect(result).toContain('.cursor');
    expect(result).toContain('.shared');
  });

  it('should skip folders that do not exist in the source directory', async () => {
    mockedAccess.mockRejectedValue(new Error('ENOENT'));
    mockedMkdir.mockResolvedValue(undefined as any);
    mockedCp.mockResolvedValue(undefined);

    const result = await copyFolders('/source', '/target', 'cursor');

    expect(mockedCp).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });

  it('should deduplicate folders when aiType is "all"', async () => {
    mockedAccess.mockResolvedValue(undefined);
    mockedMkdir.mockResolvedValue(undefined as any);
    mockedCp.mockResolvedValue(undefined);

    const result = await copyFolders('/source', '/target', 'all');

    const uniqueResult = [...new Set(result)];
    expect(result).toHaveLength(uniqueResult.length);
    expect(result).toContain('.shared');
  });

  it('should fall back to shell cp when node cp throws', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', writable: true });
    mockedAccess.mockResolvedValue(undefined);
    mockedMkdir.mockResolvedValue(undefined as any);
    mockedCp.mockRejectedValue(new Error('cp not supported'));
    mockedExec.mockImplementation((_cmd: string, callback: any) => {
      callback(null, { stdout: '', stderr: '' });
      return {} as any;
    });

    const result = await copyFolders('/source', '/target', 'cursor');

    expect(mockedExec).toHaveBeenCalled();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return empty array when both cp and shell fallback fail', async () => {
    mockedAccess.mockResolvedValue(undefined);
    mockedMkdir.mockResolvedValue(undefined as any);
    mockedCp.mockRejectedValue(new Error('cp failed'));
    mockedExec.mockImplementation((_cmd: string, callback: any) => {
      callback(new Error('exec failed'), null);
      return {} as any;
    });

    const result = await copyFolders('/source', '/target', 'cursor');

    expect(result).toHaveLength(0);
  });

  it('should exclude settings.local.json from copied files', async () => {
    mockedAccess.mockResolvedValue(undefined);
    mockedMkdir.mockResolvedValue(undefined as any);

    let capturedFilter: ((src: string) => boolean) | undefined;
    mockedCp.mockImplementation((_src, _dst, opts: any) => {
      capturedFilter = opts?.filter;
      return Promise.resolve();
    });

    await copyFolders('/source', '/target', 'cursor');

    expect(capturedFilter).toBeDefined();
    expect(capturedFilter!('/some/path/settings.local.json')).toBe(false);
    expect(capturedFilter!('/some/path/settings.json')).toBe(true);
  });
});

describe('cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove the temp directory', async () => {
    mockedRm.mockResolvedValue(undefined);

    await cleanup('/tmp/uipro-abc123');

    expect(mockedRm).toHaveBeenCalledWith('/tmp/uipro-abc123', {
      recursive: true,
      force: true,
    });
  });

  it('should not throw when rm fails', async () => {
    mockedRm.mockRejectedValue(new Error('permission denied'));

    await expect(cleanup('/tmp/uipro-abc123')).resolves.toBeUndefined();
  });
});

describe('createTempDir', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create and return a temp directory with the uipro- prefix', async () => {
    mockedTmpdir.mockReturnValue('/tmp');
    mockedMkdtemp.mockResolvedValue('/tmp/uipro-xyz789' as any);

    const result = await createTempDir();

    expect(mockedMkdtemp).toHaveBeenCalledWith(join('/tmp', 'uipro-'));
    expect(result).toBe('/tmp/uipro-xyz789');
  });
});

describe('installFromZip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process, 'platform', { value: 'linux', writable: true });
    mockedTmpdir.mockReturnValue('/tmp');
    mockedMkdtemp.mockResolvedValue('/tmp/uipro-test' as any);
  });

  it('should extract, find root, copy folders and return results', async () => {
    mockedExec.mockImplementation((_cmd: string, callback: any) => {
      callback(null, { stdout: '', stderr: '' });
      return {} as any;
    });

    const mockDirent = {
      name: 'extracted-root',
      isDirectory: () => true,
    };
    mockedReaddir.mockResolvedValue([mockDirent] as any);
    mockedAccess.mockResolvedValue(undefined);
    mockedMkdir.mockResolvedValue(undefined as any);
    mockedCp.mockResolvedValue(undefined);

    const result = await installFromZip('/path/to/file.zip', '/target', 'cursor');

    expect(result.tempDir).toBe('/tmp/uipro-test');
    expect(result.copiedFolders).toContain('.cursor');
  });

  it('should use tempDir as root when multiple directories exist in temp', async () => {
    mockedExec.mockImplementation((_cmd: string, callback: any) => {
      callback(null, { stdout: '', stderr: '' });
      return {} as any;
    });

    const mockDirents = [
      { name: 'dir1', isDirectory: () => true },
      { name: 'dir2', isDirectory: () => true },
    ];
    mockedReaddir.mockResolvedValue(mockDirents as any);
    mockedAccess.mockResolvedValue(undefined);
    mockedMkdir.mockResolvedValue(undefined as any);
    mockedCp.mockResolvedValue(undefined);

    const result = await installFromZip('/path/to/file.zip', '/target', 'cursor');

    expect(result.tempDir).toBe('/tmp/uipro-test');
    expect(Array.isArray(result.copiedFolders)).toBe(true);
  });

  it('should cleanup temp dir and rethrow when extractZip fails', async () => {
    mockedExec.mockImplementation((_cmd: string, callback: any) => {
      callback(new Error('unzip error'), null);
      return {} as any;
    });
    mockedRm.mockResolvedValue(undefined);

    await expect(
      installFromZip('/bad/file.zip', '/target', 'cursor')
    ).rejects.toThrow('Failed to extract zip');

    expect(mockedRm).toHaveBeenCalledWith('/tmp/uipro-test', {
      recursive: true,
      force: true,
    });
  });

  it('should cleanup temp dir and rethrow when readdir fails', async () => {
    mockedExec.mockImplementation((_cmd: string, callback: any) => {
      callback(null, { stdout: '', stderr: '' });
      return {} as any;
    });
    mockedReaddir.mockRejectedValue(new Error('readdir failed'));
    mockedRm.mockResolvedValue(undefined);

    await expect(
      installFromZip('/path/to/file.zip', '/target', 'cursor')
    ).rejects.toThrow('readdir failed');

    expect(mockedRm).toHaveBeenCalledWith('/tmp/uipro-test', {
      recursive: true,
      force: true,
    });
  });
});
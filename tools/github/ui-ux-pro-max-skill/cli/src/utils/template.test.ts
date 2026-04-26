import { jest } from '@jest/globals';

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  cp: jest.fn(),
  access: jest.fn(),
  readdir: jest.fn(),
}));

jest.mock('node:url', () => ({
  fileURLToPath: jest.fn(() => '/mock/path/to/template.ts'),
}));

import { readFile, mkdir, writeFile, cp, access } from 'node:fs/promises';
import {
  loadPlatformConfig,
  loadAllPlatformConfigs,
  renderSkillFile,
  generatePlatformFiles,
  generateAllPlatformFiles,
  getSupportedAITypes,
  type PlatformConfig,
} from './template';

const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockMkdir = mkdir as jest.MockedFunction<typeof mkdir>;
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockCp = cp as jest.MockedFunction<typeof cp>;
const mockAccess = access as jest.MockedFunction<typeof access>;

const makePlatformConfig = (overrides: Partial<PlatformConfig> = {}): PlatformConfig => ({
  platform: 'claude',
  displayName: 'Claude',
  installType: 'full',
  folderStructure: {
    root: '.claude',
    skillPath: 'skills',
    filename: 'ui-ux.md',
  },
  scriptPath: 'scripts/run.sh',
  frontmatter: null,
  sections: {
    quickReference: false,
  },
  title: 'UI/UX Skill',
  description: 'A UI/UX skill',
  skillOrWorkflow: 'skill',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockMkdir.mockResolvedValue(undefined as never);
  mockWriteFile.mockResolvedValue(undefined as never);
  mockCp.mockResolvedValue(undefined as never);
});

// ─── getSupportedAITypes ──────────────────────────────────────────────────────

describe('getSupportedAITypes', () => {
  it('returns all known AI types', () => {
    const types = getSupportedAITypes();
    expect(types).toContain('claude');
    expect(types).toContain('cursor');
    expect(types).toContain('copilot');
    expect(types.length).toBeGreaterThan(0);
  });
});

// ─── loadPlatformConfig ───────────────────────────────────────────────────────

describe('loadPlatformConfig', () => {
  it('returns parsed config for a known AI type', async () => {
    const config = makePlatformConfig();
    mockReadFile.mockResolvedValueOnce(JSON.stringify(config) as never);

    const result = await loadPlatformConfig('claude');

    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect((mockReadFile as jest.Mock).mock.calls[0][0]).toMatch(/claude\.json$/);
    expect(result.platform).toBe('claude');
    expect(result.title).toBe('UI/UX Skill');
  });

  it('throws for an unknown AI type without hitting the filesystem', async () => {
    await expect(loadPlatformConfig('unknown-ai')).rejects.toThrow(
      'Unknown AI type: unknown-ai'
    );
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('propagates filesystem errors', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT') as never);
    await expect(loadPlatformConfig('cursor')).rejects.toThrow('ENOENT');
  });
});

// ─── loadAllPlatformConfigs ───────────────────────────────────────────────────

describe('loadAllPlatformConfigs', () => {
  it('returns a map with entries for every successfully loaded config', async () => {
    const config = makePlatformConfig();
    mockReadFile.mockResolvedValue(JSON.stringify(config) as never);

    const result = await loadAllPlatformConfigs();

    expect(result).toBeInstanceOf(Map);
    expect(result.has('claude')).toBe(true);
    expect(result.has('cursor')).toBe(true);
  });

  it('skips platforms whose config file is missing', async () => {
    mockReadFile
      .mockResolvedValueOnce(JSON.stringify(makePlatformConfig()) as never)
      .mockRejectedValue(new Error('ENOENT') as never);

    const result = await loadAllPlatformConfigs();

    // Only the first call succeeded
    expect(result.size).toBe(1);
  });

  it('returns an empty map when all reads fail', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT') as never);

    const result = await loadAllPlatformConfigs();

    expect(result.size).toBe(0);
  });
});

// ─── renderSkillFile ──────────────────────────────────────────────────────────

describe('renderSkillFile', () => {
  const baseTemplate =
    '# {{TITLE}}\n{{DESCRIPTION}}\n{{SCRIPT_PATH}}\n{{SKILL_OR_WORKFLOW}}\n{{QUICK_REFERENCE}}';

  it('replaces all placeholders without frontmatter or quick reference', async () => {
    mockReadFile.mockResolvedValueOnce(baseTemplate as never);

    const config = makePlatformConfig({
      title: 'My Title',
      description: 'My Desc',
      scriptPath: 'scripts/run.sh',
      skillOrWorkflow: 'skill',
      frontmatter: null,
      sections: { quickReference: false },
    });

    const result = await renderSkillFile(config);

    expect(result).toContain('# My Title');
    expect(result).toContain('My Desc');
    expect(result).toContain('scripts/run.sh');
    expect(result).toContain('skill');
    expect(result).not.toContain('{{TITLE}}');
    expect(result).not.toContain('{{DESCRIPTION}}');
  });

  it('prepends frontmatter when provided', async () => {
    mockReadFile.mockResolvedValueOnce(baseTemplate as never);

    const config = makePlatformConfig({
      frontmatter: { description: 'plain value', title: 'value: with colon' },
      sections: { quickReference: false },
    });

    const result = await renderSkillFile(config);

    expect(result).toMatch(/^---\n/);
    expect(result).toContain('description: plain value');
    // value contains ":" so it must be quoted
    expect(result).toContain('title: "value: with colon"');
    expect(result).toContain('---\n');
  });

  it('appends quick reference content when sections.quickReference is true', async () => {
    mockReadFile
      .mockResolvedValueOnce(baseTemplate as never)           // base template
      .mockResolvedValueOnce('## Quick Reference\nContent' as never); // quick ref

    const config = makePlatformConfig({ sections: { quickReference: true } });

    const result = await renderSkillFile(config);

    expect(mockReadFile).toHaveBeenCalledTimes(2);
    expect(result).toContain('## Quick Reference');
  });

  it('does not load quick reference template when flag is false', async () => {
    mockReadFile.mockResolvedValueOnce(baseTemplate as never);

    const config = makePlatformConfig({ sections: { quickReference: false } });

    await renderSkillFile(config);

    expect(mockReadFile).toHaveBeenCalledTimes(1);
  });

  it('escapes double-quotes in frontmatter values', async () => {
    mockReadFile.mockResolvedValueOnce(baseTemplate as never);

    const config = makePlatformConfig({
      frontmatter: { key: 'value "with" quotes' },
      sections: { quickReference: false },
    });

    const result = await renderSkillFile(config);

    expect(result).toContain('key: "value \\"with\\" quotes"');
  });
});

// ─── generatePlatformFiles ────────────────────────────────────────────────────

describe('generatePlatformFiles', () => {
  const baseTemplate =
    '# {{TITLE}}\n{{DESCRIPTION}}\n{{SCRIPT_PATH}}\n{{SKILL_OR_WORKFLOW}}\n{{QUICK_REFERENCE}}';

  beforeEach(() => {
    // access rejects → data/scripts dirs don't exist → no cp calls
    mockAccess.mockRejectedValue(new Error('ENOENT') as never);
  });

  it('creates directory, writes skill file, and returns root folder', async () => {
    const config = makePlatformConfig();
    mockReadFile
      .mockResolvedValueOnce(JSON.stringify(config) as never) // platform config
      .mockResolvedValueOnce(baseTemplate as never);           // base template

    const result = await generatePlatformFiles('/target', 'claude');

    expect(mockMkdir).toHaveBeenCalledWith(
      expect.stringContaining('.claude'),
      { recursive: true }
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('ui-ux.md'),
      expect.any(String),
      'utf-8'
    );
    expect(result).toEqual(['.claude']);
  });

  it('copies data and scripts when source directories exist', async () => {
    const config = makePlatformConfig();
    mockReadFile
      .mockResolvedValueOnce(JSON.stringify(config) as never)
      .mockResolvedValueOnce(baseTemplate as never);

    // Both access calls succeed → directories exist
    mockAccess.mockResolvedValue(undefined as never);

    await generatePlatformFiles('/target', 'claude');

    expect(mockCp).toHaveBeenCalledTimes(2);
  });

  it('throws when an unknown AI type is supplied', async () => {
    await expect(generatePlatformFiles('/target', 'not-a-real-ai')).rejects.toThrow(
      'Unknown AI type: not-a-real-ai'
    );
    expect(mockMkdir).not.toHaveBeenCalled();
  });
});

// ─── generateAllPlatformFiles ─────────────────────────────────────────────────

describe('generateAllPlatformFiles', () => {
  const baseTemplate =
    '# {{TITLE}}\n{{DESCRIPTION}}\n{{SCRIPT_PATH}}\n{{SKILL_OR_WORKFLOW}}\n{{QUICK_REFERENCE}}';

  it('aggregates unique root folders across all platforms', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT') as never);

    const config = makePlatformConfig({ folderStructure: { root: '.claude', skillPath: 'skills', filename: 'f.md' } });
    // Each platform read: first call = platform JSON, second = base template
    mockReadFile.mockImplementation(async () => {
      // Alternate between config JSON and base template naively –
      // use a counter so even calls return JSON and odd return template.
      return JSON.stringify(config) as never;
    });
    // Intercept the base template read specifically
    let callCount = 0;
    mockReadFile.mockImplementation(async (path: unknown) => {
      if (typeof path === 'string' && path.endsWith('.json')) {
        return JSON.stringify(config);
      }
      return baseTemplate;
    });

    const result = await generateAllPlatformFiles('/target');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain('.claude');
  });

  it('skips failing platforms and returns folders for successful ones', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT') as never);

    const config = makePlatformConfig();
    let jsonCallCount = 0;
    mockReadFile.mockImplementation(async (path: unknown) => {
      if (typeof path === 'string' && path.endsWith('.json')) {
        jsonCallCount += 1;
        // Fail every second platform config
        if (jsonCallCount % 2 === 0) throw new Error('ENOENT');
        return JSON.stringify(config);
      }
      return baseTemplate;
    });

    const result = await generateAllPlatformFiles('/target');

    expect(Array.isArray(result)).toBe(true);
    // Should have at least one folder from the successful platforms
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty array when all platform generations fail', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT') as never);

    const result = await generateAllPlatformFiles('/target');

    expect(result).toEqual([]);
  });
});
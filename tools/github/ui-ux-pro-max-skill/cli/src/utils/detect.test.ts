import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { detectAIType, getAITypeDescription } from './detect.js';

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
}));

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

const CWD = '/test/project';

function makeExistsMap(dirs: string[]): (p: string) => boolean {
  return (p: string) => dirs.some((d) => p === join(CWD, d));
}

describe('detectAIType', () => {
  beforeEach(() => {
    mockExistsSync.mockReset();
  });

  it('returns empty detected and null suggested when no known directories exist', () => {
    mockExistsSync.mockReturnValue(false);

    const result = detectAIType(CWD);

    expect(result.detected).toEqual([]);
    expect(result.suggested).toBeNull();
  });

  it('detects a single AI type and suggests it', () => {
    mockExistsSync.mockImplementation(makeExistsMap(['.claude']));

    const result = detectAIType(CWD);

    expect(result.detected).toEqual(['claude']);
    expect(result.suggested).toBe('claude');
  });

  it('detects multiple AI types and suggests "all"', () => {
    mockExistsSync.mockImplementation(makeExistsMap(['.claude', '.cursor', '.github']));

    const result = detectAIType(CWD);

    expect(result.detected).toEqual(expect.arrayContaining(['claude', 'cursor', 'copilot']));
    expect(result.detected).toHaveLength(3);
    expect(result.suggested).toBe('all');
  });

  it('detects cursor correctly', () => {
    mockExistsSync.mockImplementation(makeExistsMap(['.cursor']));

    const result = detectAIType(CWD);

    expect(result.detected).toEqual(['cursor']);
    expect(result.suggested).toBe('cursor');
  });

  it('detects windsurf correctly', () => {
    mockExistsSync.mockImplementation(makeExistsMap(['.windsurf']));

    const result = detectAIType(CWD);

    expect(result.detected).toEqual(['windsurf']);
    expect(result.suggested).toBe('windsurf');
  });

  it('detects antigravity via .agent directory', () => {
    mockExistsSync.mockImplementation(makeExistsMap(['.agent']));

    const result = detectAIType(CWD);

    expect(result.detected).toEqual(['antigravity']);
    expect(result.suggested).toBe('antigravity');
  });

  it('detects copilot via .github directory', () => {
    mockExistsSync.mockImplementation(makeExistsMap(['.github']));

    const result = detectAIType(CWD);

    expect(result.detected).toEqual(['copilot']);
    expect(result.suggested).toBe('copilot');
  });

  it('detects droid via .factory directory', () => {
    mockExistsSync.mockImplementation(makeExistsMap(['.factory']));

    const result = detectAIType(CWD);

    expect(result.detected).toEqual(['droid']);
    expect(result.suggested).toBe('droid');
  });

  it('detects all supported AI types when all directories exist', () => {
    const allDirs = [
      '.claude', '.cursor', '.windsurf', '.agent', '.github',
      '.kiro', '.codex', '.roo', '.qoder', '.gemini',
      '.trae', '.opencode', '.continue', '.codebuddy', '.factory',
    ];
    mockExistsSync.mockImplementation(makeExistsMap(allDirs));

    const result = detectAIType(CWD);

    expect(result.detected).toHaveLength(15);
    expect(result.suggested).toBe('all');
    expect(result.detected).toEqual(expect.arrayContaining([
      'claude', 'cursor', 'windsurf', 'antigravity', 'copilot',
      'kiro', 'codex', 'roocode', 'qoder', 'gemini',
      'trae', 'opencode', 'continue', 'codebuddy', 'droid',
    ]));
  });

  it('uses process.cwd() as default when no cwd argument is provided', () => {
    mockExistsSync.mockReturnValue(false);

    const result = detectAIType();

    expect(result.detected).toEqual([]);
    expect(result.suggested).toBeNull();
    expect(mockExistsSync).toHaveBeenCalledWith(join(process.cwd(), '.claude'));
  });
});

describe('getAITypeDescription', () => {
  it('returns correct description for claude', () => {
    expect(getAITypeDescription('claude')).toBe('Claude Code (.claude/skills/)');
  });

  it('returns correct description for cursor', () => {
    expect(getAITypeDescription('cursor')).toBe('Cursor (.cursor/skills/)');
  });

  it('returns correct description for windsurf', () => {
    expect(getAITypeDescription('windsurf')).toBe('Windsurf (.windsurf/skills/)');
  });

  it('returns correct description for antigravity', () => {
    expect(getAITypeDescription('antigravity')).toBe('Antigravity (.agent/skills/)');
  });

  it('returns correct description for copilot', () => {
    expect(getAITypeDescription('copilot')).toBe('GitHub Copilot (.github/prompts/)');
  });

  it('returns correct description for kiro', () => {
    expect(getAITypeDescription('kiro')).toBe('Kiro (.kiro/steering/)');
  });

  it('returns correct description for codex', () => {
    expect(getAITypeDescription('codex')).toBe('Codex (.codex/skills/)');
  });

  it('returns correct description for roocode', () => {
    expect(getAITypeDescription('roocode')).toBe('RooCode (.roo/skills/)');
  });

  it('returns correct description for qoder', () => {
    expect(getAITypeDescription('qoder')).toBe('Qoder (.qoder/skills/)');
  });

  it('returns correct description for gemini', () => {
    expect(getAITypeDescription('gemini')).toBe('Gemini CLI (.gemini/skills/)');
  });

  it('returns correct description for trae', () => {
    expect(getAITypeDescription('trae')).toBe('Trae (.trae/skills/)');
  });

  it('returns correct description for opencode', () => {
    expect(getAITypeDescription('opencode')).toBe('OpenCode (.opencode/skills/)');
  });

  it('returns correct description for continue', () => {
    expect(getAITypeDescription('continue')).toBe('Continue (.continue/skills/)');
  });

  it('returns correct description for codebuddy', () => {
    expect(getAITypeDescription('codebuddy')).toBe('CodeBuddy (.codebuddy/skills/)');
  });

  it('returns correct description for droid', () => {
    expect(getAITypeDescription('droid')).toBe('Droid (Factory) (.factory/skills/)');
  });

  it('returns correct description for all', () => {
    expect(getAITypeDescription('all')).toBe('All AI assistants');
  });
});
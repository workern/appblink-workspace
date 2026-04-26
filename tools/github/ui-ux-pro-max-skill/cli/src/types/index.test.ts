import { AI_TYPES, AI_FOLDERS, AIType, InstallType, InstallConfig, PlatformConfig, Release, Asset } from './index';

describe('AI_TYPES', () => {
  it('should contain all expected AI types', () => {
    const expected: AIType[] = [
      'claude', 'cursor', 'windsurf', 'antigravity', 'copilot',
      'roocode', 'kiro', 'codex', 'qoder', 'gemini',
      'trae', 'opencode', 'continue', 'codebuddy', 'droid', 'all'
    ];
    expect(AI_TYPES).toEqual(expected);
  });

  it('should include "all" as the last element', () => {
    expect(AI_TYPES[AI_TYPES.length - 1]).toBe('all');
  });

  it('should have 16 entries', () => {
    expect(AI_TYPES).toHaveLength(16);
  });

  it('should not contain duplicate values', () => {
    const unique = new Set(AI_TYPES);
    expect(unique.size).toBe(AI_TYPES.length);
  });
});

describe('AI_FOLDERS', () => {
  it('should not contain an "all" key', () => {
    expect(AI_FOLDERS).not.toHaveProperty('all');
  });

  it('should map each AI type (except "all") to at least one folder', () => {
    for (const key of Object.keys(AI_FOLDERS) as Exclude<AIType, 'all'>[]) {
      expect(Array.isArray(AI_FOLDERS[key])).toBe(true);
      expect(AI_FOLDERS[key].length).toBeGreaterThan(0);
    }
  });

  it('should map "claude" to [".claude"]', () => {
    expect(AI_FOLDERS['claude']).toEqual(['.claude']);
  });

  it('should map "cursor" to [".cursor", ".shared"]', () => {
    expect(AI_FOLDERS['cursor']).toEqual(['.cursor', '.shared']);
  });

  it('should map "copilot" to [".github", ".shared"]', () => {
    expect(AI_FOLDERS['copilot']).toEqual(['.github', '.shared']);
  });

  it('should map "droid" to [".factory"]', () => {
    expect(AI_FOLDERS['droid']).toEqual(['.factory']);
  });

  it('should map "roocode" to [".roo", ".shared"]', () => {
    expect(AI_FOLDERS['roocode']).toEqual(['.roo', '.shared']);
  });

  it('should have exactly 15 keys (all AI types minus "all")', () => {
    expect(Object.keys(AI_FOLDERS)).toHaveLength(15);
  });

  it('should contain every AI type from AI_TYPES except "all"', () => {
    const typesWithoutAll = AI_TYPES.filter(t => t !== 'all') as Exclude<AIType, 'all'>[];
    for (const type of typesWithoutAll) {
      expect(AI_FOLDERS).toHaveProperty(type);
    }
  });

  it('shared-folder AIs should all include ".shared" as second entry', () => {
    const sharedAIs: Exclude<AIType, 'all'>[] = [
      'cursor', 'windsurf', 'antigravity', 'copilot',
      'kiro', 'roocode', 'qoder', 'gemini', 'trae', 'opencode'
    ];
    for (const ai of sharedAIs) {
      expect(AI_FOLDERS[ai]).toContain('.shared');
    }
  });

  it('single-folder AIs should not include ".shared"', () => {
    const singleFolderAIs: Exclude<AIType, 'all'>[] = ['claude', 'codex', 'continue', 'codebuddy', 'droid'];
    for (const ai of singleFolderAIs) {
      expect(AI_FOLDERS[ai]).not.toContain('.shared');
    }
  });
});

describe('Type shape validation via runtime objects', () => {
  it('should accept a valid InstallConfig object', () => {
    const config: InstallConfig = { aiType: 'claude', version: '1.0.0', force: false };
    expect(config.aiType).toBe('claude');
    expect(config.version).toBe('1.0.0');
    expect(config.force).toBe(false);
  });

  it('should accept an InstallConfig without optional fields', () => {
    const config: InstallConfig = { aiType: 'all' };
    expect(config.aiType).toBe('all');
    expect(config.version).toBeUndefined();
    expect(config.force).toBeUndefined();
  });

  it('should accept a valid Release object with assets', () => {
    const asset: Asset = {
      name: 'package.zip',
      browser_download_url: 'https://example.com/package.zip',
      size: 1024,
    };
    const release: Release = {
      tag_name: 'v1.0.0',
      name: 'Release 1.0.0',
      published_at: '2024-01-01T00:00:00Z',
      html_url: 'https://example.com/releases/v1.0.0',
      assets: [asset],
    };
    expect(release.tag_name).toBe('v1.0.0');
    expect(release.assets).toHaveLength(1);
    expect(release.assets[0].name).toBe('package.zip');
  });

  it('should accept a valid PlatformConfig object', () => {
    const config: PlatformConfig = {
      platform: 'claude',
      displayName: 'Claude',
      installType: 'full',
      folderStructure: { root: '.claude', skillPath: 'skills', filename: 'skill.md' },
      scriptPath: '/scripts/claude.sh',
      frontmatter: { key: 'value' },
      sections: { quickReference: true },
      title: 'Claude Skill',
      description: 'A skill for Claude',
      skillOrWorkflow: 'skill',
    };
    expect(config.platform).toBe('claude');
    expect(config.installType).toBe('full');
    expect(config.frontmatter).toEqual({ key: 'value' });
    expect(config.sections.quickReference).toBe(true);
  });

  it('should accept PlatformConfig with null frontmatter', () => {
    const config: PlatformConfig = {
      platform: 'cursor',
      displayName: 'Cursor',
      installType: 'reference',
      folderStructure: { root: '.cursor', skillPath: 'rules', filename: 'rules.md' },
      scriptPath: '/scripts/cursor.sh',
      frontmatter: null,
      sections: { quickReference: false },
      title: 'Cursor Rules',
      description: 'Rules for Cursor',
      skillOrWorkflow: 'workflow',
    };
    expect(config.frontmatter).toBeNull();
    expect(config.installType).toBe('reference');
  });
});
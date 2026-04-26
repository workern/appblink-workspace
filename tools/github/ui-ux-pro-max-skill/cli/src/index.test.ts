jest.mock('commander');
jest.mock('fs');
jest.mock('url');
jest.mock('path');
jest.mock('./commands/init.js');
jest.mock('./commands/versions.js');
jest.mock('./commands/update.js');
jest.mock('./types/index.js');

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initCommand } from './commands/init.js';
import { versionsCommand } from './commands/versions.js';
import { updateCommand } from './commands/update.js';
import { AI_TYPES } from './types/index.js';

const mockCommandInstance = {
  name: jest.fn().mockReturnThis(),
  description: jest.fn().mockReturnThis(),
  version: jest.fn().mockReturnThis(),
  command: jest.fn().mockReturnThis(),
  option: jest.fn().mockReturnThis(),
  action: jest.fn().mockReturnThis(),
  parse: jest.fn().mockReturnThis(),
};

(Command as jest.MockedClass<typeof Command>).mockImplementation(
  () => mockCommandInstance as unknown as Command
);

(fileURLToPath as jest.Mock).mockReturnValue('/mock/path/src/index.ts');
(dirname as jest.Mock).mockReturnValue('/mock/path/src');
(join as jest.Mock).mockReturnValue('/mock/path/package.json');
(readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ version: '1.0.0' }));
(AI_TYPES as unknown as string[]) = ['cursor', 'copilot', 'cline'];

describe('CLI index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    (Command as jest.MockedClass<typeof Command>).mockImplementation(
      () => mockCommandInstance as unknown as Command
    );
    (fileURLToPath as jest.Mock).mockReturnValue('/mock/path/src/index.ts');
    (dirname as jest.Mock).mockReturnValue('/mock/path/src');
    (join as jest.Mock).mockReturnValue('/mock/path/package.json');
    (readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ version: '1.0.0' }));
    (AI_TYPES as unknown as string[]) = ['cursor', 'copilot', 'cline'];
  });

  describe('init command action', () => {
    let initActionHandler: (options: Record<string, unknown>) => Promise<void>;

    beforeEach(async () => {
      jest.resetModules();

      const mockCmd = {
        name: jest.fn().mockReturnThis(),
        description: jest.fn().mockReturnThis(),
        version: jest.fn().mockReturnThis(),
        command: jest.fn().mockReturnThis(),
        option: jest.fn().mockReturnThis(),
        action: jest.fn().mockImplementation(function (this: unknown, fn) {
          initActionHandler = fn;
          return this;
        }),
        parse: jest.fn().mockReturnThis(),
      };

      jest.doMock('commander', () => ({ Command: jest.fn(() => mockCmd) }));
      jest.doMock('fs', () => ({
        readFileSync: jest.fn().mockReturnValue(JSON.stringify({ version: '1.0.0' })),
      }));
      jest.doMock('url', () => ({
        fileURLToPath: jest.fn().mockReturnValue('/mock/path/src/index.ts'),
      }));
      jest.doMock('path', () => ({
        dirname: jest.fn().mockReturnValue('/mock/path/src'),
        join: jest.fn().mockReturnValue('/mock/path/package.json'),
      }));
      jest.doMock('./commands/init.js', () => ({
        initCommand: jest.fn().mockResolvedValue(undefined),
      }));
      jest.doMock('./commands/versions.js', () => ({
        versionsCommand: jest.fn().mockResolvedValue(undefined),
      }));
      jest.doMock('./commands/update.js', () => ({
        updateCommand: jest.fn().mockResolvedValue(undefined),
      }));
      jest.doMock('./types/index.js', () => ({
        AI_TYPES: ['cursor', 'copilot', 'cline'],
      }));

      await import('./index.js');
    });

    it('calls initCommand with valid ai type', async () => {
      const { initCommand: mockedInit } = await import('./commands/init.js');

      if (initActionHandler!) {
        await initActionHandler({ ai: 'cursor', force: true, offline: false });
        expect(mockedInit).toHaveBeenCalledWith({
          ai: 'cursor',
          force: true,
          offline: false,
        });
      }
    });

    it('calls initCommand without ai type when ai is not provided', async () => {
      const { initCommand: mockedInit } = await import('./commands/init.js');

      if (initActionHandler!) {
        await initActionHandler({ ai: undefined, force: false, offline: false });
        expect(mockedInit).toHaveBeenCalledWith({
          ai: undefined,
          force: false,
          offline: false,
        });
      }
    });

    it('calls process.exit(1) for invalid ai type in init', async () => {
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      if (initActionHandler!) {
        await expect(
          initActionHandler({ ai: 'invalid-ai', force: false, offline: false })
        ).rejects.toThrow('process.exit called');

        expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid AI type: invalid-ai');
        expect(processExitSpy).toHaveBeenCalledWith(1);
      }

      processExitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('update command action', () => {
    let updateActionHandler: (options: Record<string, unknown>) => Promise<void>;

    beforeEach(async () => {
      jest.resetModules();

      const mockCmd = {
        name: jest.fn().mockReturnThis(),
        description: jest.fn().mockReturnThis(),
        version: jest.fn().mockReturnThis(),
        command: jest.fn().mockReturnThis(),
        option: jest.fn().mockReturnThis(),
        action: jest.fn().mockImplementation(function (this: unknown, fn) {
          updateActionHandler = fn;
          return this;
        }),
        parse: jest.fn().mockReturnThis(),
      };

      jest.doMock('commander', () => ({ Command: jest.fn(() => mockCmd) }));
      jest.doMock('fs', () => ({
        readFileSync: jest.fn().mockReturnValue(JSON.stringify({ version: '1.0.0' })),
      }));
      jest.doMock('url', () => ({
        fileURLToPath: jest.fn().mockReturnValue('/mock/path/src/index.ts'),
      }));
      jest.doMock('path', () => ({
        dirname: jest.fn().mockReturnValue('/mock/path/src'),
        join: jest.fn().mockReturnValue('/mock/path/package.json'),
      }));
      jest.doMock('./commands/init.js', () => ({
        initCommand: jest.fn().mockResolvedValue(undefined),
      }));
      jest.doMock('./commands/versions.js', () => ({
        versionsCommand: jest.fn().mockResolvedValue(undefined),
      }));
      jest.doMock('./commands/update.js', () => ({
        updateCommand: jest.fn().mockResolvedValue(undefined),
      }));
      jest.doMock('./types/index.js', () => ({
        AI_TYPES: ['cursor', 'copilot', 'cline'],
      }));

      await import('./index.js');
    });

    it('calls updateCommand with valid ai type', async () => {
      const { updateCommand: mockedUpdate } = await import('./commands/update.js');

      if (updateActionHandler!) {
        await updateActionHandler({ ai: 'copilot' });
        expect(mockedUpdate).toHaveBeenCalledWith({ ai: 'copilot' });
      }
    });

    it('calls process.exit(1) for invalid ai type in update', async () => {
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      if (updateActionHandler!) {
        await expect(
          updateActionHandler({ ai: 'bad-ai' })
        ).rejects.toThrow('process.exit called');

        expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid AI type: bad-ai');
        expect(processExitSpy).toHaveBeenCalledWith(1);
      }

      processExitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('calls updateCommand without ai when not provided', async () => {
      const { updateCommand: mockedUpdate } = await import('./commands/update.js');

      if (updateActionHandler!) {
        await updateActionHandler({ ai: undefined });
        expect(mockedUpdate).toHaveBeenCalledWith({ ai: undefined });
      }
    });
  });

  describe('versions command', () => {
    it('registers versionsCommand as action for versions command', async () => {
      jest.resetModules();

      const registeredActions: Array<() => void> = [];

      const mockCmd = {
        name: jest.fn().mockReturnThis(),
        description: jest.fn().mockReturnThis(),
        version: jest.fn().mockReturnThis(),
        command: jest.fn().mockReturnThis(),
        option: jest.fn().mockReturnThis(),
        action: jest.fn().mockImplementation(function (this: unknown, fn) {
          registeredActions.push(fn);
          return this;
        }),
        parse: jest.fn().mockReturnThis(),
      };

      const mockVersionsCommand = jest.fn().mockResolvedValue(undefined);

      jest.doMock('commander', () => ({ Command: jest.fn(() => mockCmd) }));
      jest.doMock('fs', () => ({
        readFileSync: jest.fn().mockReturnValue(JSON.stringify({ version: '1.0.0' })),
      }));
      jest.doMock('url', () => ({
        fileURLToPath: jest.fn().mockReturnValue('/mock/path/src/index.ts'),
      }));
      jest.doMock('path', () => ({
        dirname: jest.fn().mockReturnValue('/mock/path/src'),
        join: jest.fn().mockReturnValue('/mock/path/package.json'),
      }));
      jest.doMock('./commands/init.js', () => ({
        initCommand: jest.fn().mockResolvedValue(undefined),
      }));
      jest.doMock('./commands/versions.js', () => ({
        versionsCommand: mockVersionsCommand,
      }));
      jest.doMock('./commands/update.js', () => ({
        updateCommand: jest.fn().mockResolvedValue(undefined),
      }));
      jest.doMock('./types/index.js', () => ({
        AI_TYPES: ['cursor', 'copilot', 'cline'],
      }));

      await import('./index.js');

      expect(mockCmd.action).toHaveBeenCalled();
      expect(registeredActions.length).toBeGreaterThan(0);
    });
  });

  describe('program setup', () => {
    it('reads package.json and sets version', async () => {
      jest.resetModules();

      const mockParse = jest.fn();
      const mockVersion = jest.fn().mockReturnThis();

      const mockCmd = {
        name: jest.fn().mockReturnThis(),
        description: jest.fn().mockReturnThis(),
        version: mockVersion,
        command: jest.fn().mockReturnThis(),
        option: jest.fn().mockReturnThis(),
        action: jest.fn().mockReturnThis(),
        parse: mockParse.mockReturnThis(),
      };

      jest.doMock('commander', () => ({ Command: jest.fn(() => mockCmd) }));
      jest.doMock('fs', () => ({
        readFileSync: jest.fn().mockReturnValue(JSON.stringify({ version: '2.5.0' })),
      }));
      jest.doMock('url', () => ({
        fileURLToPath: jest.fn().mockReturnValue('/mock/path/src/index.ts'),
      }));
      jest.doMock('path', () => ({
        dirname: jest.fn().mockReturnValue('/mock/path/src'),
        join: jest.fn().mockReturnValue('/mock/path/package.json'),
      }));
      jest.doMock('./commands/init.js', () => ({
        initCommand: jest.fn().mockResolvedValue(undefined),
      }));
      jest.doMock('./commands/versions.js', () => ({
        versionsCommand: jest.fn().mockResolvedValue(undefined),
      }));
      jest.doMock('./commands/update.js', () => ({
        updateCommand: jest.fn().mockResolvedValue(undefined),
      }));
      jest.doMock('./types/index.js', () => ({
        AI_TYPES: ['cursor', 'copilot', 'cline'],
      }));

      await import('./index.js');

      expect(mockVersion).toHaveBeenCalledWith('2.5.0');
      expect(mockParse).toHaveBeenCalled();
    });
  });
});
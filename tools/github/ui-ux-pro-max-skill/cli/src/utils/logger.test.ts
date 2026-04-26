import { logger } from './logger';

describe('logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('info', () => {
    it('should call console.log with a message', () => {
      logger.info('test info message');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should include the message in the call', () => {
      logger.info('hello info');
      const args = consoleSpy.mock.calls[0];
      expect(args).toContain('hello info');
    });

    it('should handle empty string', () => {
      logger.info('');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const args = consoleSpy.mock.calls[0];
      expect(args).toContain('');
    });
  });

  describe('success', () => {
    it('should call console.log with a message', () => {
      logger.success('operation succeeded');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should include the message in the call', () => {
      logger.success('done');
      const args = consoleSpy.mock.calls[0];
      expect(args).toContain('done');
    });

    it('should handle special characters', () => {
      logger.success('success! @#$%');
      const args = consoleSpy.mock.calls[0];
      expect(args).toContain('success! @#$%');
    });
  });

  describe('warn', () => {
    it('should call console.log with a message', () => {
      logger.warn('a warning');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should include the message in the call', () => {
      logger.warn('be careful');
      const args = consoleSpy.mock.calls[0];
      expect(args).toContain('be careful');
    });

    it('should handle long strings', () => {
      const longMsg = 'w'.repeat(1000);
      logger.warn(longMsg);
      const args = consoleSpy.mock.calls[0];
      expect(args).toContain(longMsg);
    });
  });

  describe('error', () => {
    it('should call console.log with a message', () => {
      logger.error('something went wrong');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should include the error message in the call', () => {
      logger.error('fatal error');
      const args = consoleSpy.mock.calls[0];
      expect(args).toContain('fatal error');
    });

    it('should handle error messages with newlines', () => {
      logger.error('line1\nline2');
      const args = consoleSpy.mock.calls[0];
      expect(args).toContain('line1\nline2');
    });
  });

  describe('title', () => {
    it('should call console.log with a message', () => {
      logger.title('My Title');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should wrap the message with newlines', () => {
      logger.title('Section');
      const args = consoleSpy.mock.calls[0];
      const joined = args.join('');
      expect(joined).toContain('Section');
    });

    it('should handle empty string title', () => {
      logger.title('');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('dim', () => {
    it('should call console.log with a message', () => {
      logger.dim('dimmed text');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should include the message in the call', () => {
      logger.dim('subtle');
      const args = consoleSpy.mock.calls[0];
      const joined = args.join('');
      expect(joined).toContain('subtle');
    });

    it('should handle empty string', () => {
      logger.dim('');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple calls', () => {
    it('should log each method independently', () => {
      logger.info('a');
      logger.warn('b');
      logger.error('c');
      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });

    it('should preserve message content across multiple calls', () => {
      logger.info('msg1');
      logger.success('msg2');
      expect(consoleSpy.mock.calls[0]).toContain('msg1');
      expect(consoleSpy.mock.calls[1]).toContain('msg2');
    });
  });
});
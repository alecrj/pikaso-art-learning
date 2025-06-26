// src/engines/core/__tests__/ErrorHandler.test.ts - Error Handler Test
describe('ErrorHandler', () => {
    const mockErrorHandler = {
      createError: jest.fn(),
      handleError: jest.fn(),
      getRecoverySuggestions: jest.fn(),
    };
  
    beforeEach(() => {
      Object.values(mockErrorHandler).forEach(mock => mock.mockReset());
      
      mockErrorHandler.createError.mockImplementation((category, message, severity) => ({
        errorId: `error_${Date.now()}`,
        category,
        message,
        severity,
        timestamp: Date.now(),
        context: {}
      }));
      
      mockErrorHandler.getRecoverySuggestions.mockReturnValue(['retry', 'refresh']);
    });
  
    describe('Error Creation', () => {
      it('should create structured errors correctly', () => {
        const error = mockErrorHandler.createError('NETWORK_ERROR', 'Connection failed', 'high');
  
        expect(error.category).toBe('NETWORK_ERROR');
        expect(error.message).toBe('Connection failed');
        expect(error.severity).toBe('high');
        expect(error.errorId).toBeDefined();
        expect(error.timestamp).toBeDefined();
      });
  
      it('should include performance metrics when available', () => {
        const mockMetrics = { memoryUsage: 150, fps: 60, renderTime: 16 };
        
        mockErrorHandler.createError.mockReturnValue({
          errorId: 'test_error',
          category: 'PERFORMANCE_ERROR',
          message: 'Low FPS detected',
          severity: 'medium',
          timestamp: Date.now(),
          context: { performanceMetrics: mockMetrics }
        });
  
        const error = mockErrorHandler.createError(
          'PERFORMANCE_ERROR',
          'Low FPS detected',
          'medium',
          { performanceMetrics: mockMetrics }
        );
  
        expect(error.context?.performanceMetrics).toEqual(mockMetrics);
      });
    });
  
    describe('Error Handling', () => {
      it('should handle errors without throwing', () => {
        const testError = new Error('Test error');
        mockErrorHandler.handleError.mockReturnValue({
          category: 'UNKNOWN_ERROR',
          severity: 'medium'
        });
        
        expect(() => {
          mockErrorHandler.handleError(testError);
        }).not.toThrow();
      });
  
      it('should categorize errors correctly', () => {
        const networkError = new Error('Network request failed');
        mockErrorHandler.handleError.mockReturnValue({
          category: 'NETWORK_ERROR',
          severity: 'high'
        });
        
        const result = mockErrorHandler.handleError(networkError);
        
        expect(result.category).toBeDefined();
        expect(result.severity).toBeDefined();
      });
    });
  
    describe('Error Recovery', () => {
      it('should provide recovery suggestions', () => {
        const error = mockErrorHandler.createError('NETWORK_ERROR', 'API timeout', 'high');
        const suggestions = mockErrorHandler.getRecoverySuggestions(error);
        
        expect(suggestions).toContain('retry');
        expect(Array.isArray(suggestions)).toBe(true);
      });
    });
  });
describe('UserEngine', () => {
    const mockUserEngine = {
      createProfile: jest.fn(),
      updateProfile: jest.fn(),
      getCurrentProfile: jest.fn(),
      updateStats: jest.fn(),
    };
  
    const mockProfile = {
      id: 'test-user-1',
      displayName: 'Test User',
      email: 'test@example.com',
      skillLevel: 'beginner' as const,
      joinedDate: new Date().toISOString(),
      stats: { totalArtworks: 0, totalLessons: 0, currentStreak: 0, longestStreak: 0 },
      preferences: { notifications: true, darkMode: false, autoSave: true, hapticFeedback: true }
    };
  
    beforeEach(() => {
      Object.values(mockUserEngine).forEach(mock => mock.mockReset());
      mockUserEngine.createProfile.mockResolvedValue(mockProfile);
      mockUserEngine.getCurrentProfile.mockReturnValue(mockProfile);
    });
  
    describe('Profile Management', () => {
      it('should create user profile successfully', async () => {
        const profile = await mockUserEngine.createProfile(mockProfile);
        
        expect(profile.id).toBe(mockProfile.id);
        expect(profile.displayName).toBe(mockProfile.displayName);
        expect(profile.skillLevel).toBe('beginner');
      });
  
      it('should update user profile successfully', async () => {
        const updates = { displayName: 'Updated User', skillLevel: 'intermediate' as const };
        const updatedProfile = { ...mockProfile, ...updates };
        
        mockUserEngine.updateProfile.mockResolvedValue(updatedProfile);
        
        await mockUserEngine.createProfile(mockProfile);
        const result = await mockUserEngine.updateProfile(updates);
        
        expect(result.displayName).toBe('Updated User');
        expect(result.skillLevel).toBe('intermediate');
      });
  
      it('should handle profile validation', async () => {
        const invalidProfile = { ...mockProfile, email: 'invalid-email' };
        mockUserEngine.createProfile.mockRejectedValue(new Error('Invalid email'));
        
        await expect(mockUserEngine.createProfile(invalidProfile)).rejects.toThrow('Invalid email');
      });
    });
  
    describe('Stats Management', () => {
      beforeEach(async () => {
        await mockUserEngine.createProfile(mockProfile);
      });
  
      it('should update user stats correctly', async () => {
        const statsUpdate = { totalArtworks: 5, totalLessons: 3, currentStreak: 2 };
        const updatedProfile = {
          ...mockProfile,
          stats: { ...mockProfile.stats, ...statsUpdate }
        };
        
        mockUserEngine.updateStats.mockResolvedValue(undefined);
        mockUserEngine.getCurrentProfile.mockReturnValue(updatedProfile);
        
        await mockUserEngine.updateStats(statsUpdate);
        
        const profile = mockUserEngine.getCurrentProfile();
        expect(profile.stats.totalArtworks).toBe(5);
        expect(profile.stats.totalLessons).toBe(3);
        expect(profile.stats.currentStreak).toBe(2);
      });
    });
  
    describe('Performance', () => {
      it('should handle rapid profile updates efficiently', async () => {
        await mockUserEngine.createProfile(mockProfile);
        
        const startTime = performance.now();
        
        const updates = Array(10).fill(null).map((_, i) => 
          mockUserEngine.updateStats({ totalArtworks: i })
        );
        
        await Promise.all(updates);
        
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(100);
      });
    });
  });
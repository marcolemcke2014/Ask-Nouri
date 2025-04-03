import { 
  UserProfile, 
  MenuAnalysis, 
  ScanHistoryItem, 
  SavedMenuItem, 
  HealthGoal,
  DietaryRestriction
} from '../../types';

// In-memory database for development
export class InMemoryDb {
  private userProfiles: Map<string, UserProfile> = new Map();
  private menuAnalyses: Map<string, MenuAnalysis> = new Map();
  private scanHistory: Map<string, ScanHistoryItem> = new Map();
  private savedMenuItems: Map<string, SavedMenuItem> = new Map();

  // User Profile Methods
  public getUserProfile(id: string): UserProfile | undefined {
    return this.userProfiles.get(id);
  }

  public createUserProfile(profile: UserProfile): UserProfile {
    this.userProfiles.set(profile.id, profile);
    return profile;
  }

  public updateUserProfile(id: string, updates: Partial<UserProfile>): UserProfile | undefined {
    const profile = this.userProfiles.get(id);
    if (!profile) return undefined;

    const updated = { ...profile, ...updates };
    this.userProfiles.set(id, updated);
    return updated;
  }

  // Menu Analysis Methods
  public getMenuAnalysis(id: string): MenuAnalysis | undefined {
    return this.menuAnalyses.get(id);
  }

  public getAllMenuAnalyses(): MenuAnalysis[] {
    return Array.from(this.menuAnalyses.values());
  }

  public createMenuAnalysis(analysis: MenuAnalysis): MenuAnalysis {
    this.menuAnalyses.set(analysis.id, analysis);
    return analysis;
  }

  // Scan History Methods
  public getScanHistory(id: string): ScanHistoryItem | undefined {
    return this.scanHistory.get(id);
  }

  public getAllScanHistory(): ScanHistoryItem[] {
    return Array.from(this.scanHistory.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createScanHistoryItem(item: ScanHistoryItem): ScanHistoryItem {
    this.scanHistory.set(item.id, item);
    return item;
  }

  public updateScanHistoryItem(id: string, updates: Partial<ScanHistoryItem>): ScanHistoryItem | undefined {
    const item = this.scanHistory.get(id);
    if (!item) return undefined;

    const updated = { ...item, ...updates };
    this.scanHistory.set(id, updated);
    return updated;
  }

  public deleteScanHistoryItem(id: string): boolean {
    return this.scanHistory.delete(id);
  }

  // Saved Menu Item Methods
  public getSavedMenuItem(id: string): SavedMenuItem | undefined {
    return this.savedMenuItems.get(id);
  }

  public getAllSavedMenuItems(): SavedMenuItem[] {
    return Array.from(this.savedMenuItems.values())
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  public createSavedMenuItem(item: SavedMenuItem): SavedMenuItem {
    this.savedMenuItems.set(item.id, item);
    return item;
  }

  public deleteSavedMenuItem(id: string): boolean {
    return this.savedMenuItems.delete(id);
  }

  // Initialize with default data for development
  public initializeWithDefaults(): void {
    // Create default user profile
    const defaultProfile: UserProfile = {
      id: 'default-user',
      name: 'John Doe',
      healthGoals: [HealthGoal.WeightLoss, HealthGoal.LowCarb],
      dietaryRestrictions: [DietaryRestriction.None],
      preferredCuisines: ['Italian', 'Japanese', 'Mexican'],
      saveHistory: true
    };

    this.createUserProfile(defaultProfile);
  }
}

// Export a singleton instance
export const inMemoryDb = new InMemoryDb();
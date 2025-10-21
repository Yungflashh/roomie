export declare class MatchingService {
    static calculateCompatibilityScore(profile1: any, profile2: any): {
        score: number;
        breakdown: any;
    };
    private static calculateBudgetScore;
    private static calculateLocationScore;
    private static toRadians;
    private static calculateLifestyleScore;
    private static calculateInterestsScore;
    private static calculateMoveInDateScore;
    private static calculateLeaseDurationScore;
    static findMatches(userId: string, filters?: {
        minScore?: number;
        maxDistance?: number;
        limit?: number;
    }): Promise<any[]>;
    static createMatch(userId1: string, userId2: string, message?: string): Promise<any>;
}
//# sourceMappingURL=matching.service.d.ts.map
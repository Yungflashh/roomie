import { ValidationChain } from 'express-validator';
export declare class GameValidator {
    static createGame(): ValidationChain[];
    static updateGame(): ValidationChain[];
    static getGameById(): ValidationChain[];
    static deleteGame(): ValidationChain[];
}
export declare class GameSessionValidator {
    static createSession(): ValidationChain[];
    static joinSession(): ValidationChain[];
    static submitAnswer(): ValidationChain[];
}
export declare class UserStatsValidator {
    static getUserStats(): ValidationChain[];
    static getCategoryLeaderboard(): ValidationChain[];
    static manageFavorite(): ValidationChain[];
}
//# sourceMappingURL=game.validator.d.ts.map
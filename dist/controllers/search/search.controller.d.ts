import { Response } from 'express';
export declare class SearchController {
    static searchProfiles: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    private static fallbackSearch;
    static autocomplete: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getAggregations: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static reindexAll: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static indexProfile: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=search.controller.d.ts.map
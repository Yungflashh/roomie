export declare class SearchService {
    static searchAllMessages(userId: string, query: string, options?: {
        page?: number;
        limit?: number;
        type?: string;
    }): Promise<any>;
    static searchMedia(userId: string, roomId: string, mediaType: 'image' | 'video' | 'file', options?: {
        page?: number;
        limit?: number;
    }): Promise<any>;
}
//# sourceMappingURL=search.service.d.ts.map
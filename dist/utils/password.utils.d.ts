export declare class PasswordUtils {
    static hash(password: string): Promise<string>;
    static compare(candidatePassword: string, hashedPassword: string): Promise<boolean>;
    static validateStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=password.utils.d.ts.map
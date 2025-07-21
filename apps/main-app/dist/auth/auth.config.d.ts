export interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
    created_at: string;
}
export declare const getDatabase: () => any;

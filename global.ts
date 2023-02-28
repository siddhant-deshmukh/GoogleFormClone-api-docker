import { IUser } from "./models/users";

export {};

declare global {
    namespace Express {
        export interface Response {
            jsonStatusOk: (obj: any) => void;
            jsonStatusError: (obj: any) => void;
            user: IUser
        }
    }
}
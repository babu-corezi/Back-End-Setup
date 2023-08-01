import { BaseError, ErrorCodes } from "./BaseError";

export class AuthError extends BaseError {
    code = ErrorCodes.ERROR_NOT_AUTHORIZED;

    constructor(message: string, code?: string, ) {
        super(message, code, 400);
        Object.setPrototypeOf(this, AuthError.prototype); 
      }
}
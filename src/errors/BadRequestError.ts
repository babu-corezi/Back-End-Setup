import { BaseError, ErrorCodes } from "./BaseError";

export class BadRequestError extends BaseError {
    code = ErrorCodes.ERROR_BAD_REQUEST;

    constructor(message: string, code?: string, ) {
        super(message, code, 400);
        Object.setPrototypeOf(this, BadRequestError.prototype); 
      }
}
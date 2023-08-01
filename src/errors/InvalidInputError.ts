import { BaseError, ErrorCodes } from "./BaseError";

export class InvalidInputError extends BaseError {
    code = ErrorCodes.ERROR_INVALID_INPUT;

    constructor(message: string, code?: string, ) {
        super(message, code, 400);
        Object.setPrototypeOf(this, InvalidInputError.prototype); 
      }
}
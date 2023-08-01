export class BaseError extends Error {
    httpStatus: number;
    httpCode: string;
    constructor(message: string, httpCode?: string, httpStatus?: number) {
        super(message);
        Object.setPrototypeOf(this, BaseError.prototype);
        this.httpStatus = httpStatus || 500;
        this.httpCode = httpCode || ErrorCodes.ERROR_INTERNAL_SERVER_ERROR;
    }
}

export enum ErrorCodes {
    ERROR_NOT_FOUND = 'ERROR_NOT_FOUND',
    ERROR_BAD_REQUEST = 'ERROR_BAD_REQUEST',
    ERROR_NOT_AUTHORIZED = 'ERROR_NOT_AUTHORIZED',
    ERROR_INVALID_INPUT = 'ERROR_INVALID_INPUT',
    ERROR_EMPTY_BODY = 'ERROR_EMPTY_BODY',
    ERROR_MISSING_PROPERTY = 'ERROR_MISSING_PROPERTY',
    ERROR_INTERNAL_SERVER_ERROR = 'ERROR_INTERNAL_SERVER_ERROR',
    ERROR_PROPVALUE_TYPEMISMATCH = "ERROR_PROPVALUE_TYPEMISMATCH"
}
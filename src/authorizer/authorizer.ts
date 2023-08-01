import * as express from "express";
import { Connection } from "typeorm";
import { USERID_HEADER, AUTHN_HEADER, UNKNOWN_USERID, AUTHN_PREFIX } from "../constants";
import { AuthError } from "../errors/AuthError";
import { ErrorCodes } from "../errors/BaseError";
import * as jwt from 'jsonwebtoken';

export interface RequestIds {
    userId: string;
    subId?: string;
    email?: string;
    tokenInfo?: any;
}

export interface TokenInfo {
    valid: boolean;
    userId?: string;
    email?: string;
    decoded: any;
  }

export async function authorizer(req: express.Request, conn: Connection) {
    for (const header of [USERID_HEADER]) {
        if (!(header in req.headers)) {
            throw new AuthError(`Missing Header: ${header}`, ErrorCodes.ERROR_NOT_AUTHORIZED);
        }
    }

    let userId: string = UNKNOWN_USERID;



    if (USERID_HEADER in req.headers) {
        userId = (<string>req.headers[USERID_HEADER]).trim();
    }

    const requestIds: RequestIds = { userId: null }
    const authnHeader = <string>req.headers[AUTHN_HEADER];

    let token = null;
    if (authnHeader.startsWith(AUTHN_PREFIX)) {
        token = authnHeader.substring(AUTHN_PREFIX.length).trim();
    } else {
        throw new AuthError(`Malformed Authorization Header. Doesn't start with: ${AUTHN_PREFIX}`, ErrorCodes.ERROR_NOT_AUTHORIZED);
    }

    const decoded = jwt.decode(token, { complete: true }) as { [key: string]: any };
    if (!decoded || !decoded.header || !decoded.payload) {
        throw new AuthError('Bad Authorization token: jwt.decode failed', ErrorCodes.ERROR_NOT_AUTHORIZED);
    }

    const tokenDetails: TokenInfo = { valid: false, decoded: decoded };
    const tokenInfo = await getAccessTokenInfo(token, tokenDetails);
    if (!tokenInfo.valid) {
        throw new AuthError('Bad Authorization token: invalid', ErrorCodes.ERROR_NOT_AUTHORIZED);
    }
    
    requestIds.userId = requestIds.userId === 'UNKNOWN_USERID' ? tokenInfo.userId : requestIds.userId;
    requestIds.email = tokenInfo.email;
    requestIds.userId = requestIds.userId;
    requestIds.tokenInfo = tokenInfo;

    if (decoded) {
        var currentTime = new Date().getTime() / 1000;
        if (currentTime > decoded.payload.exp) {
            throw new AuthError(`Access Token expired`, ErrorCodes.ERROR_NOT_AUTHORIZED);
        }
    }

    return requestIds;
}

function getAccessTokenInfo(token: string, tokenInfo: TokenInfo) {
    const decoded = tokenInfo.decoded;
    try {
        jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
        if (err.message !== 'jwt expired') { // TBD: remove this after UI can get new tokens on 401
            throw new AuthError(`Cognito Token validation failed: ${err.message}`, ErrorCodes.ERROR_NOT_AUTHORIZED);
        }
    }
    tokenInfo.valid = true;
    tokenInfo.email = decoded.payload.email;
    tokenInfo.userId = decoded.payload.userId
    return tokenInfo;
}
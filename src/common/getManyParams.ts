import { JSONObject } from "../types/types";

export const DEFAULT_PAGE_SIZE = 25;
export const MIN_PAGE_SIZE = 1;
export const MAX_PAGE_SIZE = 1000;
export const START_PAGE_NO = 1;

export enum OrderDirType {
    ASC = "ASC",
    DESC = "DESC"
}

export enum OperatorType {
    EQUALS = 'EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    RANGE = 'RANGE',
    IN = 'IN',
    NOT_IN = 'NOT_IN',
    LIKE = 'LIKE',
    NOT_LIKE = 'NOT_LIKE',
    IS_NULL = 'IS_NULL',
}

export interface Condition {
    name: string;
    value: string;
    booleanValue?: boolean;
    operator: OperatorType;
}

export interface GetManyParams {
    pageNo?: number;
    pageSize?: number;
    offset?: number;
    take?: number;
    order?: JSONObject;
    relations?: string[];
    where?: Condition[];
}

export function toGetManyBody(query: any) {
    if (typeof(query) === 'string') {
        const pairs = !query ? [] : query.split('&');
        query = {};
        for (const pair of pairs) {
            const nvp = pair.split('=');
            if(nvp[0] === 'pageNo'){
                const pageNo = query.pageNo ? Number(query.pageNo) : START_PAGE_NO;
                const take = query.pageSize ? Number(query.pageSize) : DEFAULT_PAGE_SIZE;
                const offset = (pageNo - START_PAGE_NO) * take;
                query['pageNo'] = Number(offset);
            } else if(nvp[0] === 'pageSize') {
            const pageSize = Number(query.pageSize);
            if (MIN_PAGE_SIZE <= pageSize && pageSize <= MAX_PAGE_SIZE) {
                    query['pageSize'] = pageSize;
                }
            } else {
                query[nvp[0]] = nvp[1];
            }
        }
    }
    return query;
}

export function toGetManyParams(query: any): GetManyParams {
    if (typeof(query) === 'string') {
        const pairs = !query ? [] : query.split('&');
        query = {};
        for (const pair of pairs) {
            const nvp = pair.split('=');
            query[nvp[0]] = nvp[1];
        }
    }
    const gmParams: GetManyParams = {
        pageNo: START_PAGE_NO,
        pageSize: DEFAULT_PAGE_SIZE,
        take: DEFAULT_PAGE_SIZE,
        offset: 0, // page nos. start at 1 
        where: <Condition[]>[],
    };

    for (const param of Object.keys(query)) {
        switch (param) {
            case 'pageNo':
                const pageNo = query.pageNo ? Number(query.pageNo) : START_PAGE_NO;
                const take = query.pageSize ? Number(query.pageSize) : DEFAULT_PAGE_SIZE;
                const offset = (pageNo - START_PAGE_NO) * take;
                gmParams.offset = Number(offset);
                gmParams.pageNo = pageNo;
                break;
            case 'pageSize':
                const pageSize = Number(query.pageSize);
                if (MIN_PAGE_SIZE <= pageSize && pageSize <= MAX_PAGE_SIZE) {
                    gmParams.take = pageSize;
                    gmParams.pageSize = pageSize;
                }
                break;
            case 'orderBy':
                gmParams.order = {[query.orderBy] : query.orderDir ? query.orderDir.toUpperCase(): OrderDirType.ASC}
                break;
            case 'select':
                gmParams.relations = query.select.split(',').map(e => e.trim());
                break;
            default:
                if(param !== 'orderDir'){
                    gmParams.where.push(makeWhereCondition(query, param));
                }
        }
    }
    return gmParams;
}

function makeWhereCondition(query: any, param: string): Condition {
    let name = param;
    let operator = OperatorType.EQUALS;
    let value = query[param];

    /*
     * '&' is doublly encoded in the client -- once by our code and then again by fetch call.
     * So need to doubly decode -- once by expressjs and then again here.
     */
    if(value.includes('%26')){
      value =  value.replace(/%26/g, '&') 
    }

    const colonIndex = param.indexOf(':');
    if (colonIndex !== -1) {
        const comps = param.split(':');
        name = comps[0];
        const op = comps[1];
        switch (op.toUpperCase()) {
            case 'RANGE':
                operator = OperatorType.RANGE; break;
            case 'IN':
                operator = OperatorType.IN; break;
            case 'NOT_IN':
                operator = OperatorType.NOT_IN; break;
            case 'NOT':
                operator = OperatorType.NOT_EQUALS; break;
            case 'LIKE':
                operator = OperatorType.LIKE; break;
            case 'NOT_LIKE':
                operator = OperatorType.NOT_LIKE; break;
            case 'IS_NULL':
                operator = OperatorType.IS_NULL; break;
            default:
        }
    }
    return {name, value, operator};
}

export default GetManyParams;

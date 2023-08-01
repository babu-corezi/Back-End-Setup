import { Connection, EntityManager, Like } from "typeorm";
import { GetManyResponse, JSONObject, PrimaryKey } from "../types/types";
import GetManyParams, { OperatorType } from "./getManyParams";
import { RequestIds } from "../authorizer/authorizer";

export interface GetManyQueryParams {
    take?: number;
    skip?: number;
    order?: JSONObject;
    relations?: string[];
    where?: JSONObject;
};
export async function getManyQuery(conn: Connection, entity: string, params: GetManyParams, auth?: RequestIds, action?: string){
    const entityRepository = await conn.getRepository(entity);
    const getManyQuery = await findQuery(params, auth, action);
    const records = await entityRepository.findAndCount({
        take: getManyQuery?.take,
        skip: getManyQuery?.skip,
        where: getManyQuery?.where,
        relations: getManyQuery?.relations,
        order: getManyQuery?.order
    });
	const getManyresponse: GetManyResponse = {
        records: records[0],
        totalCount: records[1]
    }
    return getManyresponse;
}

export async function getEntityColumn(entity: string, columnName: string, conn: Connection){
	const columns = conn.getMetadata(entity).columns;
	const columnMetadata = columns.find((x) => x.propertyName === columnName);
    if(columnMetadata){
        return true;
    }else{
        return false;
    }
}

export async function getOneQueryWithTxn(manager: EntityManager, entity: string, id: PrimaryKey, params: GetManyParams){
    const getManyQuery = await findQuery(params);
    const records = await manager.findOne(entity, {
        relations: getManyQuery.relations
    });
    return records;
};

export async function getManyQueryWithTxn(manager: EntityManager, entity: string, params: GetManyParams){

    const getManyQuery = await findQuery(params);
    const records = await manager.findAndCount(entity, {
        take: getManyQuery.take,
        skip: getManyQuery.skip,
        where: getManyQuery.where,
        relations: getManyQuery.relations,
        order: getManyQuery.order
    });
	const getManyresponse: GetManyResponse = {
        records: records[0],
        totalCount: records[1]
    }
    return getManyresponse;
}

async function findQuery(params: GetManyParams, auth?: RequestIds, action?: string, columns?: boolean) {
    const findQuery: GetManyQueryParams = {
        take: params.take,
        skip: params.offset,
        order: params.order,
        relations: params.relations
    };
    for (const param of Object.keys(params)) {
        if(param === 'where'){
            const whereCondition = {};
            for (const param of params.where) {
                if(param.operator === OperatorType.EQUALS){
                    whereCondition[param.name] = param.value
                } else if (param.operator === OperatorType.LIKE) {
                    whereCondition[param.name]= Like(`%${param.value}%`)
                }
            }
            findQuery.where = whereCondition;
        };
    }
    return findQuery;
}
import { Connection, EntityManager, Repository } from "typeorm";
import { RequestIds } from "../authorizer/authorizer";
import { BadRequestError } from "../errors/BadRequestError";
import { ErrorCodes } from "../errors/BaseError";
import { JSONObject, PrimaryKey } from "../types/types";
import { isISO8601Date } from "../utils/validateDateTime";
import { isUUIDv4 } from "../utils/validateUUID";
import GetManyParams, { toGetManyParams } from "./getManyParams";
import { getManyQuery, getManyQueryWithTxn, getOneQueryWithTxn } from "./getManyQuery";

export async function getMany(entity: string, conn: Connection, gmArgs?: string | GetManyParams, auth?: RequestIds, action?: string) {
	if (!gmArgs) gmArgs = '';
    const params = typeof (gmArgs) === 'string' ? toGetManyParams(gmArgs) : gmArgs;
	return await getManyQuery(conn, entity, params, auth, action);
}

export async function getManyWithTxn(entity: string, manager: EntityManager, gmArgs?: string | GetManyParams, requestIds?: RequestIds) {
	if (!gmArgs) gmArgs = '';
    const params = typeof (gmArgs) === 'string' ? toGetManyParams(gmArgs) : gmArgs;
	return await getManyQueryWithTxn(manager, entity, params);
}

export async function getOneWithTxn(entity: string, manager: EntityManager, id: PrimaryKey, gmArgs?: string | GetManyParams) {
	if (!gmArgs) gmArgs = '';
    const params = typeof (gmArgs) === 'string' ? toGetManyParams(gmArgs) : gmArgs;
	return await getOneQueryWithTxn(manager, entity, id, params);
}

export async function getOne(entity: string, conn: Connection, id: PrimaryKey) {
	const entityRepository = await conn.getRepository(entity);
	const alias = getPK(entityRepository);
	if (alias && alias.length) {
		const records= await entityRepository.findOne({ [alias]: id });
		return records || {};
	} else {
		throw new BadRequestError("Primary Key Not Found", ErrorCodes.ERROR_MISSING_PROPERTY);
	}
}

export async function Create(entity: string, conn: Connection, body: JSONObject, auth?: RequestIds) {
	await validateBody(entity, body, conn)
	await validateMandatoryField(entity, conn, body);
	const entityRepository = await conn.getRepository(entity);
	return await entityRepository.save(body);
}

export async function Update(entity: string, conn: Connection, body: JSONObject, id: PrimaryKey) {
	await validateBody(entity, body,conn)
	const entityManager = new EntityManager(conn);
	const result = await entityManager.transaction(async(manager)=>{
		const records = await manager.findOne(entity, id);
		if(records){
			for (const prop of Object.keys(body)) {
				records[prop] = body[prop]
			};
			await manager.save(records);
			return records;
		}else{
			throw new BadRequestError(`No ${entity} found for this ${id}`, ErrorCodes.ERROR_BAD_REQUEST);
		}
	});
	return result;
}

export async function Delete(entity: string, conn: Connection, id: PrimaryKey) {
	const entityManager = new EntityManager(conn);
	const result = await entityManager.transaction(async(manager)=>{
		const records = await manager.findOne(entity, id);
		if(records){
			return await manager.remove(records);
		}else{
			throw new BadRequestError(`No ${entity} found for this ${id}`, ErrorCodes.ERROR_BAD_REQUEST);
		}
	});
	return result;
}

export const getPK = (entityRepository: Repository<unknown>) => {
	const pk = entityRepository?.metadata?.columns.filter((col: any) => {
		return col.isPrimary;
	});
	if (pk && pk.length) {
		return pk[0]?.propertyAliasName;
	} else {
		throw new BadRequestError("Primary Key Not Found", ErrorCodes.ERROR_MISSING_PROPERTY);
	}
};

export async function validateBody(entity: string, body: JSONObject, conn: Connection) {
	if (!body || Object.keys(body).length === 0 || !body.constructor || body.constructor !== Object) {
		throw new BadRequestError("Request body must be non-empty JSON string", ErrorCodes.ERROR_EMPTY_BODY);
	}

	const columns = conn.getMetadata(entity).columns;
	for (const field of Object.keys(body)) {
		const value = body[field];
		const columnMetadata = columns.find((x) => x.propertyName === field);
		if(!columnMetadata){
			throw new BadRequestError(`Unknown property: ${field}`, ErrorCodes.ERROR_MISSING_PROPERTY);
		}
		if(!value){
			continue;
		}else if(value.constructor === Boolean || value.constructor === Number || value.constructor === String ||
			(columnMetadata?.[field]?.type === 'simple-array' && value.constructor === Array) ||
			(columnMetadata?.[field]?.type === 'simple-json' && (value.constructor === Array || value.constructor === Object) )) {	
			const columnMetadata = columns.find((x) => x.propertyName === field);				
			const type = columnMetadata.type instanceof Function ? columnMetadata.type.name : columnMetadata.type;
			await validateValue(field, value, type);
		}
	}
};

export async function validateValue(field: string, value: string, schemaValueType: string, ){
	const valueType = value.constructor.name;
	let expectedValueTypes = [schemaValueType];

	if (['uuid', 'datetime', 'Date', 'string', 'varchar'].includes(schemaValueType)) {
		expectedValueTypes = ['String'];
	} else if (schemaValueType === 'simple-array') {
		expectedValueTypes = ['Array'];
	} else if (schemaValueType === 'simple-json') {
		expectedValueTypes = ['Object', 'Array'];
	} else if (['int', 'integer', 'bigint'].includes(schemaValueType)) {
		if (!Number.isInteger(value)) {
			throw new BadRequestError(`Expecting int for field: ${field}`, ErrorCodes.ERROR_PROPVALUE_TYPEMISMATCH);
		}
		expectedValueTypes = ['Number'];
	} else if (['number', 'float', 'decimal'].includes(schemaValueType)) {
		if (Number.isNaN(value)) {
			throw new BadRequestError(`Expecting inumber for field: ${field}`, ErrorCodes.ERROR_PROPVALUE_TYPEMISMATCH);
		}
		expectedValueTypes = ['Number'];
	}
	if (!expectedValueTypes.includes(valueType)) {
		throw new BadRequestError(`Unexpected value type for field: ${field}. Expected ${expectedValueTypes.join('|')}, Got ${valueType}`,
			ErrorCodes.ERROR_PROPVALUE_TYPEMISMATCH);
	}
	if (schemaValueType === 'uuid') {
		if (!isUUIDv4(value)) {
			throw new BadRequestError(`Unexpected value format for field: ${field}. Expecting UUIDv4 format string`,
				ErrorCodes.ERROR_PROPVALUE_TYPEMISMATCH);
		}
	} else if (schemaValueType === 'datetime' || schemaValueType === 'Date') {
		if (!isISO8601Date(value)) {
			throw new BadRequestError(`Unexpected value format for field: ${field}. Expecting ISO 8601 Date string (YYYY-MM-DDThh:mm:ss[.sss]Z)`,
				ErrorCodes.ERROR_PROPVALUE_TYPEMISMATCH);
		}
	}
};

export async function validateMandatoryField(name: string, conn: Connection, body: JSONObject){
	const entityMetadata = await conn.getMetadata(name).columns;
	for(const col of entityMetadata){
		if(!col.isNullable && !col.isGenerated && !col.isCreateDate && !col.isUpdateDate && !('default' in col)) {
			if (!(col.propertyName in body)) {
				throw new BadRequestError(`Missing mandatory property: ${col.propertyName}`, ErrorCodes.ERROR_MISSING_PROPERTY);
			}
		}
	};
};

export async function validateGetParams(entity: string, conn: Connection, params: string[]){
	if (!params) return;
    const emd = conn.getMetadata(entity);
    for (const prop of params) {
	 	const relations = emd.relations.find(x=> x.propertyName === prop);
		const relationIds = emd.relationIds.find(x=> x.propertyName === prop);
		if(!relations && !relationIds){
			throw new BadRequestError(`Unknown property: ${prop}`, ErrorCodes.ERROR_MISSING_PROPERTY);
		}
		continue;
	}
};

export async function getEntityRepository(entity: string, conn: Connection){
    const repository = await conn.getRepository(entity);
	return repository;
};
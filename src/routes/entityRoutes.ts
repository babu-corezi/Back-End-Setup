import * as express from "express";
import { Connection } from "typeorm";
import { Create, getMany, getOne, Update, Delete } from "../common/entityRestOperation";
import { toGetManyParams } from "../common/getManyParams";
import { AuthError } from "../errors/AuthError";
import { BadRequestError } from "../errors/BadRequestError";
import { BaseError, ErrorCodes } from "../errors/BaseError";
import { InvalidInputError } from "../errors/InvalidInputError";

export async function attachRoutes(router: express.Router, conn: Connection) {
	for (const entityMetadata of conn.entityMetadatas) {
		const { name } = entityMetadata;
		routesForEntities(name, router, conn);
	}
}

function routesForEntities(entity: string, router: express.Router, conn: Connection) {
	console.log('attach routres')
	const path = `/entity/${entity}`;

	router.get(path, async (req, res) => {
		verifyRequest(req, res, conn, async () => {
			const gmParams = toGetManyParams(req.query);
			const records = await getMany(entity, conn, gmParams);
			res.status(200).send({
				...records,
				pageNo: gmParams.pageNo,
				pageSize: gmParams.pageSize
			});
		});
	});

	router.get(path + "/:id", async (req, res) => {
		verifyRequest(req, res, conn, async () => {
			const records = await getOne(entity, conn, req.params.id);
			res.send(records);
		});
	});

	router.post(path, async (req, res) => {
		verifyRequest(req, res, conn, async () => {
			const records = await Create(entity, conn, req.body);
			res.send(records);
		});
	});

	router.patch(path + "/:id", async (req, res) => {
		verifyRequest(req, res, conn, async () => {
			const records = await Update(entity, conn, req.body, req.params.id);
			res.send(records);
		});
	});

	router.delete(path + "/:id", async (req, res) => {
		verifyRequest(req, res, conn, async () => {
			const records = await Delete(entity, conn, req.params.id);
			res.send(records);
		});
	});
}

export async function verifyRequest(req: express.Request, res: express.Response,  conn: Connection,  handle: () => Promise<any>) {
	try {
		res.set("Content-Type", "application/json");
		await handle();
	} catch (err) {
		reportError(res, err);
	}
}

function reportError(res: express.Response, err: Error) {
	if (err instanceof BadRequestError || err instanceof InvalidInputError) {
		res.status(400);
	} else if (err instanceof AuthError) {
		res.status(401);
	} else if (err instanceof BaseError) {
		res.status(err?.httpStatus);
	} else {
		console.log("Internal ERROR:", err);
		res.status(500);
	}
	const code = (<any>err).code || ErrorCodes.ERROR_INTERNAL_SERVER_ERROR;
	res.send({ error: { code, message: err.message } });
}

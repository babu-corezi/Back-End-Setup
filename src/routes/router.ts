import  * as express from "express";
import { Connection } from "typeorm";
import { verifyRequest } from "./entityRoutes";
import { toGetManyBody } from "../common/getManyParams";

export async function attachRoutesForRouter(router: express.Router, conn: Connection){
    console.log('routesforrouter')
    router.get('/', (req,res)=>{
        res.send("New Project backend lambda");
    });

}
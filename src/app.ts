import * as dotenv from 'dotenv';
dotenv.config();
import { DBOptions } from "./config/DBOptions";
import { DEFAULT_PORT } from './constants';
import { Server } from "./server";

const PORT =  process.env.PORT || DEFAULT_PORT
async function main() {
    const server = new Server();
    await server.initialize(DBOptions, PORT, '/v1');
    server.listen();
}
main().catch(console.error);
import { SimpleExpressServer } from "./server/SimpleExpressServer";
import { ConnPool } from "./server/ConnPool";
const SERVER_NAME = 'New Project';

export class Server {
    connPool: ConnPool;
    server: SimpleExpressServer;

    constructor(connPool?: ConnPool) {
        this.connPool = connPool;
    }

    async initialize(dbOptions: any, port: number | string, path?: string) {
        if (!this.connPool) {
            this.connPool = new ConnPool(dbOptions);
        }
        const conn = await this.connPool.Connection();
        if (Number(port) >= 0) {
            this.server = new SimpleExpressServer(conn, port, path, true, SERVER_NAME);
        }
    }

    listen() {
        this.server.listen();
    }
    
    async close() {
        if (this.server) {
            await this.server.close();
        }
        if (this.connPool) {
            await this.connPool.closeConnection();
        }
    }
}

let server: Server = null;
export function getServer(): Server {
    if (!server) {
        server = new Server();
    }
    return server;
}
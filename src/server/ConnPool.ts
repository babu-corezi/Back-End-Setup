import { Connection, createConnection } from "typeorm";
import { isThisTypeNode } from "typescript";
const MAX_CONNECTION = 25;

interface Conn {
    connection: Connection;
    nextConn: Conn;
}

export class ConnPool {
    noConnection: Conn;
    useConnection: Conn;
    name: string;
    connCount: number;
    dbOptions: any;

    constructor(dbOptions: any) {
        this.noConnection = null;
        this.useConnection = null;
        this.dbOptions = {...dbOptions};
        this.name = dbOptions?.name ? dbOptions.name : 'default';
        this.connCount = 0;
    }

    async Connection(): Promise<Connection> {
        if (!this.noConnection) {
            const name = `${this.name}-${this.connCount}`;
            this.connCount += 1;
            if (this.connCount > MAX_CONNECTION) {
                console.log(`WARN:: Connection: too many inuse connections: ${this.connCount}`);
            }
            const dbOptions = {...this.dbOptions, name};
            const connection = await createConnection(dbOptions);
            this.noConnection = {connection, nextConn: null};
        }

        const conn = this.noConnection;
        this.noConnection = this.noConnection.nextConn;
        const inuseConn = this.useConnection;
        conn.nextConn = inuseConn;
        this.useConnection = conn;
        
        return conn.connection;
    }

    private async closeConnList(conn: Conn): Promise<number> {
        let count = 0;
        while (conn) {
            await conn.connection.close();
            conn = conn.nextConn;
            count += 1;
        }
        return count;
    }

    async closeConnection(): Promise<void> {
        let count = await this.closeConnList(this.noConnection);
        this.noConnection = null;

        count += await this.closeConnList(this.useConnection);
        this.useConnection = null;
        this.connCount = 0;
    }
}
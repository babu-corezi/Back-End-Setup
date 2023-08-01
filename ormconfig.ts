import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";
import { ConnectionOptions } from "typeorm";

const config: ConnectionOptions = {
    type: process.env.DBTYPE as any,
    host: process.env.DBHOST,
    port: process.env.DBPORT as any,
    username: process.env.DBUSERNAME,
    password: process.env.DBPASSWORD,
    database:process.env.DBNAME,
    entities: [''],
    synchronize: false,
    migrationsRun: false,
    logging: false,
    migrations: [""],
}

export = config;
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";
import { ConnectionOptions } from "typeorm";

const config: ConnectionOptions = {
    type: "mysql",
    host: "localhost",
    port: 4507,
    username: process.env.DBUSERNAME,
    password: "",
    database: "",
    entities: [''],
    synchronize: false,
    migrationsRun: false,
    logging: false,
    migrations: [""],
}

export = config;
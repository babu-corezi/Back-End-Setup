export const DBOptions = {
    name: "New Project",
    connectTimeout: 60*60*1000,
    acquireTimeout:60*60*1000,
    type: process.env.DBTYPE,
    host: process.env.DBHOST,
    port: process.env.DBPORT,
    username: process.env.DBUSERNAME,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME,
    entities: [  ],
    synchronize: false
}
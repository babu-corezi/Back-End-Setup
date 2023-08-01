import { Router } from "express";
import * as express from "express";
import * as cookieParser from "cookie-parser";
import * as cors from "cors";
import * as morgan from "morgan";
import { attachRoutes } from "../routes/entityRoutes";
import { attachRoutesForRouter } from "../routes/router";
import { Connection } from "typeorm";
import exp = require("constants");

export class SimpleExpressServer {
    private app: express.Express;
    private listener: any;
    private port: number | string;
    private mountPath: string;
    private router: Router;

    constructor(connPool: Connection, port: number | string, mountPath?: string, enableLogging?: boolean, serviceName?: string) {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.text());
        this.app.use(express.urlencoded({extended: true}));
        this.app.use(cookieParser());
        this.app.use(cors());

        if (enableLogging) {
            this.app.use(morgan((logs, res, req) => {
                return [
                    'INFO',
                    logs.date(req, res, 'iso'),
                    logs.method(req, res),
                    logs.url(req, res),
                    logs.status(req, res),
                    logs.res(req, res, 'content-length'),
                    `${logs['response-time'](req, res)}ms`,
                    serviceName || '-',
                ].join(' ');
            }));
        }
        this.router = express.Router();
        attachRoutes(this.router, connPool);
        attachRoutesForRouter(this.router, connPool);
        if (!mountPath) mountPath = '/';
        this.app.use(mountPath, this.router);
        this.app.use((req, res, next) => { 
            res.status(404).send({ error: { message: 'Not Found' }});
        });
        this.mountPath = mountPath;
        this.port = port;
    }

    public listen() {
        this.listener = this.app.listen(this.port,async () => {
            console.log(`Listening on port ${this.port}, basePath: ${this.mountPath}`);            
        });
    }
    
    public close() {
        if (this.listener) {
            this.listener.close();
        }
    }

    public get expressApp(): express.Express {
        return this.app;
    }
}
export type GetManyResponse = {records: any[],totalCount: number};
export type GetOneResponse = any;
export type JSONObject = { [field: string]: any };
export type PrimaryKey = number | string | { [prop: string]: number | string };
export type GetManyQueryParams = {
    offset?: number;
    take?: number;
    order?: string;
    relations?: string[];
    where?: JSONObject;
};
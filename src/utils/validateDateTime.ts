const isoDateRegex = /^[1-9][0-9]{3}-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-6][0-9]:[0-6][0-9](\.[0-9]+)?Z$/;
export function isISO8601Date(value: any): boolean {
    return (typeof (value) === 'string' && value.match(isoDateRegex)) ? true : false;
}
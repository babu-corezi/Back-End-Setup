const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUUIDv4(value: any): boolean {
    return (typeof (value) === 'string' && value.length === 36 && value.match(uuidRegex)) ? true : false;
}
export function generateParams(input: any) : (string | number) [] {
    if (typeof input === 'object') {
        const params = Object.keys(input)?.map((e) => {
            if (typeof input[e] === 'object') {
                return input[e] ? `${JSON.stringify(input[e])}` : null;
            } else if (typeof input[e] === 'number') {
                return input[e] ? input[e] : 0;
            } else if (typeof input[e] === 'boolean') {
                return input[e] ? input[e] : false;
            }
            return input[e] ? `${input[e]}` : null;
        });
        return params;
    }
    return input;
};
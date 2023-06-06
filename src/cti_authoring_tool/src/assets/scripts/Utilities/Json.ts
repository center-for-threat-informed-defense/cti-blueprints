/**
 * Looks up a value in an object.
 * @param path
 *  The path to the value.
 * @param json
 *  The object.
 * @returns
 *  The value.
 */
export function lookup(path: string, json: any): any | undefined {
    let tokens = path.split(/\./g);
    let node = json;
    for(let token of tokens) {
        if(node instanceof Object && token in node) {
            node = node[token]
        } else {
            return undefined;
        }
    } 
    return node;
}

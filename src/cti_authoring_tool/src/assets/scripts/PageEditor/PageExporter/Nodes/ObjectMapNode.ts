import { ExportNode } from "./ExportNode";

export class ObjectMapNode extends ExportNode<Object> {

    /**
     * Creates a new {@link ObjectMapNode}.
     */
    constructor() {
        super();
    }


    /**
     * Serializes the node to an object.
     * @returns
     *  The object.
     */
    public override toObject(): Object {
        let entries = [];
        for(let [key, value] of this) {
            entries.push([key, value.toObject()]);
        }
        return Object.fromEntries(entries);
    }

}

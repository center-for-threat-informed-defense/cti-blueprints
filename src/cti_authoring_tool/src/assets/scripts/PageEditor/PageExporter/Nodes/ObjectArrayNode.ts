import * as Crypto from "@/assets/scripts/Utilities";
import { ExportNode } from "./ExportNode";
import { Value } from "./Value";
import { MapNode } from "./MapNode";

export class ObjectArrayNode extends ExportNode<(Object | Value)[]> {

    /**
     * Creates a new {@link ObjectArrayNode}.
     */
    constructor() {
        super();
    }


    /**
     * Appends a new {@link MapNode} to the end of the array.
     * @returns
     *  The {@link MapNode}'s assigned index.
     */
    public push(node: MapNode): string {
        // Generate index
        let index;
        do {
            index = Crypto.randomUUID()
        } while(this.has(index));
        // Assign node
        this.set(index, node);
        // Return index
        return index;
    }
    
    /**
     * Serializes the node to an object.
     * @returns
     *  The object.
     */
    public override toObject(): (Object | Value)[] {
        let arr = [];
        for(let value of this.values()) {
            arr.push(value.toObject());
        }
        return arr;
    }

}

import { ExportNode } from "./ExportNode";
import { Value } from "./Value";

export class AtomicNode extends ExportNode<Value> {

    /**
     * The node's value.
     */
    public value: Value 


    /**
     * Creates a new {@link AtomicNode}.
     * @param value
     *  The node's value.
     */
    constructor(value: Value) {
        super();
        this.value = value;
    }


    /**
     * Serializes the node to an object.
     * @returns
     *  The object.
     */
    public override toObject(): Value {
        return this.value;
    }

}

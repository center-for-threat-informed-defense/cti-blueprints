import { MapNode } from "./MapNode";

export abstract class ExportNode<E> extends Map<string, MapNode>{
    
    /**
     * Creates a new {@link ExportNode}.
     */
    constructor() {
        super();
    }


    /**
     * Serializes the node to an object.
     * @returns
     *  The object.
     */
    public abstract toObject(): E;

}

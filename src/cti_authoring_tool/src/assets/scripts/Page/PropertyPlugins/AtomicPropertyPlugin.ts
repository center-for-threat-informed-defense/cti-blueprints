import { AtomicProperty } from "../Property/AtomicProperty";
import { PropertyPlugin } from "./PropertyPlugin";

export abstract class AtomicPropertyPlugin extends PropertyPlugin {

    /**
     * Creates a new {@link PropertyPlugin}.
     */
    constructor() {
        super();
    }


    public abstract onSelect(): void;

    public abstract onDeselect(): void;

}

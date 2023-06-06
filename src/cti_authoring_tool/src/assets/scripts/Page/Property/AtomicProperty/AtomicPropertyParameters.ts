import { PropertyParameters } from "../PropertyParameters";
import { Alignment } from "./Alignment";

export interface AtomicPropertyParameters extends PropertyParameters {

    /**
     * If the property is required or not.
     */
    required?: boolean;

    /**
     * The property's alignment.
     */
    alignment?: Alignment;

}

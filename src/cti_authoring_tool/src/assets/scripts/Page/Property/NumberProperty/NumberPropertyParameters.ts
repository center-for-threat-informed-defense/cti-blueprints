import { AtomicPropertyParameters } from "../AtomicProperty/AtomicPropertyParameters";

export interface NumberPropertyParameters extends AtomicPropertyParameters {

    /**
     * The property's minimum allowed value.
     */
    min?: number | null;

    /**
     * The property's maximum allowed value.
     */
    max?: number | null;

}

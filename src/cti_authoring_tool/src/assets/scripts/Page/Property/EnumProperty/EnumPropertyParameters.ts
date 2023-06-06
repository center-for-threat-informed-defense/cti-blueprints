import { AtomicPropertyParameters } from "../AtomicProperty/AtomicPropertyParameters";

export interface EnumPropertyParameters extends AtomicPropertyParameters {

    /**
     * The property's set of options.
     */
    // TODO: `value` must be restricted to valid JSON types
    options: { id: string, text: string, value: any }[] 

}
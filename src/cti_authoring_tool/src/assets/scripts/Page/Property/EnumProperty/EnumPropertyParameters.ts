import { AtomicPropertyParameters } from "../AtomicProperty/AtomicPropertyParameters";

export interface EnumPropertyParameters extends AtomicPropertyParameters {

    /**
     * The property's set of options.
     */
    options: { value: string, text: string }[] 

}

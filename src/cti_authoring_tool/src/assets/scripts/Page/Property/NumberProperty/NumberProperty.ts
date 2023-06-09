import { AtomicProperty } from "..";
import { PropertyAssembler } from "../PropertyAssembler";
import { NumberPropertyParameters } from "./NumberPropertyParameters";

export abstract class NumberProperty extends AtomicProperty {

    /**
     * The property's minimum allowed value.
     */
    public readonly min: number;

    /**
     * The property's maximum allowed value.
     */
    public readonly max: number;

    /**
     * The property's value.
     */
    protected _value: number | null;

    
    /**
     * The property's value.
     */
    public abstract override get value(): number | null;

    /**
     * The property value's setter.
     */
    public abstract override set value(value: number | null);


    /**
     * Creates a new {@link NumberProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: NumberPropertyParameters);

    /**
     * Creates a new {@link NumberProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: NumberPropertyParameters, assembler?: PropertyAssembler);
    constructor(params: NumberPropertyParameters, assembler?: PropertyAssembler) {
        super(params, assembler);
        this.min = params.min ?? -Infinity;
        this.max = params.max ?? Infinity;
        this._value = null;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. toString  /////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Returns a string representation of the property.
     * @returns
     *  A string representation of the property.
     */
    public override toString(): string | undefined {
        return this.value !== null ? `${ this.value }` : undefined;
    }

}

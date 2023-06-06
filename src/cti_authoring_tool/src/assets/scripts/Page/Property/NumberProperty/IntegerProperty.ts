import { clamp } from "@/assets/scripts/Utilities";
import { AtomicProperty } from "..";
import { NumberProperty } from "./NumberProperty";
import { PropertyAssembler } from "../PropertyAssembler";
import { NumberPropertyParameters } from "./NumberPropertyParameters";

export class IntegerProperty extends NumberProperty {

    /**
     * The property's value.
     */
    public override get value(): number | null {
        return this._value;
    }

    /**
     * The property value's setter.
     */
    public override set value(value: number | null) {
        let lastValue = this.value;
        if(value === null) {
            this._value = value;
        } else {
            this._value = Math.round(clamp(value, this.min, this.max));
        }
        this.emit("update", this.value, lastValue);
    }

    
    /**
     * Creates a new {@link IntegerProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: NumberPropertyParameters);

    /**
     * Creates a new {@link IntegerProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: NumberPropertyParameters, assembler?: PropertyAssembler);
    constructor(params: NumberPropertyParameters, assembler?: PropertyAssembler) {
        super(params, assembler);
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Property Cloning  /////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Clones the property.
     * @returns
     *  The cloned property.
     */
    public override clone(): IntegerProperty

    /**
     * Clones the property.
     * @param assembler
     *  The cloned property's assembler.
     * @returns
     *  The cloned property.
     */
    public override clone(assembler?: PropertyAssembler): IntegerProperty {
        // Create property
        let prop = new IntegerProperty({
            id        : this.id,
            name      : this.name,
            path      : this.path,
            link      : this.link,
            row       : this.row,
            col       : this.col,
            required  : this.required,
            alignment : this.alignment,
            min       : this.min,
            max       : this.max
        }, assembler);
        // Clone values
        prop.value = this.value;
        // Clone plugins
        this._plugins?.forEach(({ plugin }) => {
            prop.tryInstallPlugin(plugin)
        });
        // Return
        return prop;
    }

}

import { clamp } from "@/assets/scripts/Utilities";
import { PageSection } from "../../PageSection";
import { AtomicProperty } from "..";
import { INumberProperty } from "./INumberProperty";
import { NumberPropertyTemplate, PropertyType } from "../../../AppConfiguration";

export class NumberProperty extends AtomicProperty implements INumberProperty {

    /**
     * The property's value.
     */
    public value: number | null;

    /**
     * The property's minimum allowed value.
     */
    public readonly min: number;

    /**
     * The property's maximum allowed value.
     */
    public readonly max: number;


    /**
     * Creates a new {@link NumberProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     */
    constructor(section: PageSection, template: NumberPropertyTemplate);

    /**
     * Creates a new {@link NumberProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @param value
     *  The property's value.
     */
    constructor(section: PageSection, template: NumberPropertyTemplate, value: number);
    constructor(section: PageSection, template: NumberPropertyTemplate, value?: number) {
        super(section, template);
        this.value = null;
        this.min = template.min ?? -Infinity;
        this.max = template.max ?? Infinity;
        if(value !== undefined) {
            this.setValue(value);
        } else if(template.default !== undefined) {
            this.setValue(template.default);
        } else {
            this.setValue(null);
        }
        this.initializePlugins(template);
    }

    ///////////////////////////////////////////////////////////////////////////
    ///  1. INumberProperty Methods  //////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Sets the property's value directly.
     * @param value
     *  The property's new value.
     */
    public setValue(value: number | null): void {
        // If null value
        if(value === null) {
            this.value = value;
            return;
        }
        // If numeric value
        let v = clamp(value, this.min, this.max);
        if(this.type === PropertyType.Integer) {
            this.value = Math.round(v);
        } else {
            this.value = v;
        }
    }

    /**
     * Creates a new command.
     */
    public newCommand(): void {
        // TODO: Implement command construct
        throw new Error("Method not implemented.");
    }
    
    /**
     * Returns a string representation of the property.
     * @returns
     *  A string representation of the property.
     */
    public override toString(): string | undefined {
        return this.value !== null ? `${ this.value }` : undefined;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  2. Event Methods  ////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Property update behavior.
     * @param newValue
     *  The property's new value.
     * @param oldValue
     *  The property's old value.
     */
    public onUpdate(newValue: number, oldValue: number) {
        // TODO: Link update event
        this.emit("update", newValue, oldValue);
        this._section.onPropertyUpdate(this, newValue, oldValue);
    }

}

import { PageSection } from "../../PageSection";
import { AtomicProperty } from "..";
import { IAtomicProperty } from "../AtomicProperty/IAtomicProperty";
import { EnumPropertyTemplate } from "@/assets/scripts/AppConfiguration";

export class EnumProperty extends AtomicProperty implements IAtomicProperty {

    /**
     * The property's value.
     */
    public value: string | null;

    /**
     * The property's set of options.
     */
    public readonly options: Map<string, { text: string, value: any }>


    /**
     * Creates a new {@link EnumProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     */
    constructor(section: PageSection, template: EnumPropertyTemplate);

    /**
     * Creates a new {@link EnumProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @param value
     *  The property's value.
     */
    constructor(section: PageSection, template: EnumPropertyTemplate, value: string);
    constructor(section: PageSection, template: EnumPropertyTemplate, value?: string) {
        super(section, template);
        this.value = null;
        this.options = new Map();
        // Validate options
        for(let option of template.options) {
            let { id, text, value } = option;
            if(!this.options.has(id)) {
                this.options.set(id, { text, value })
            } else {
                throw new Error("All enum ids must be unique.");
            }
        }
        // Set value
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
    public setValue(value: string | null): void {
        // Validate value
        if(value === null) {
            this.value = null;
        } else if(this.options.has(value)) {
            this.value = value;
        } else {
            throw new Error(`Enum value '${ value }' is not a valid option.`);
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
        return this.value !== null ? this.options.get(this.value)!.text : undefined;
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
    public onUpdate(newValue: any, oldValue: any) {
        // TODO: Link update event
        this.emit("update", newValue, oldValue);
        this._section.onPropertyUpdate(this, newValue, oldValue);
    }

}

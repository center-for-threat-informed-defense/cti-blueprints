import { DateTimeProperty } from "./DateTimeProperty";
import { PropertyAssembler } from "../PropertyAssembler";
import { AtomicPropertyParameters } from "../AtomicProperty/AtomicPropertyParameters";

export class DateProperty extends DateTimeProperty {

    /**
     * Creates a new {@link DateProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: AtomicPropertyParameters);

    /**
     * Creates a new {@link DateProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: AtomicPropertyParameters, assembler?: PropertyAssembler);
    constructor(params: AtomicPropertyParameters, assembler?: PropertyAssembler) {
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
    public override clone(): DateProperty;

    /**
     * Clones the property.
     * @param assembler
     *  The cloned property's assembler.
     * @param excludePlugins
     *  If true, plugins will not be installed on the cloned property.
     *  (Default: false)
     * @returns
     *  The cloned property.
     */
    public override clone(assembler?: PropertyAssembler, excludePlugins?: boolean): DateProperty
    public override clone(assembler?: PropertyAssembler, excludePlugins: boolean = false): DateProperty {
        // Create property
        let prop = new DateProperty({
            id        : this.id,
            name      : this.name,
            path      : this.path,
            link      : this.link,
            row       : this.row,
            col       : this.col,
            required  : this.required,
            alignment : this.alignment
        }, assembler);
        // Clone plugins
        if(!excludePlugins) {
            this._plugins?.forEach(({ plugin }) => prop.tryInstallPlugin(plugin));
        }
        // Clone values
        prop.value = this.value;
        // Return
        return prop;
    }

}

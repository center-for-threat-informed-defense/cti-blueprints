import { BasicTablePropertyLayout } from "./BasicTablePropertyLayout";
import { BasicTablePropertyParameters, TabularProperty, TabularPropertyAssembler } from "..";

export class BasicTableProperty extends TabularProperty {

    /**
     * The table's layout.
     */
    public readonly layout: BasicTablePropertyLayout;
    

    /**
     * Creates a new {@link BasicTableProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: BasicTablePropertyParameters);
    
    /**
     * Creates a new {@link BasicTableProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: BasicTablePropertyParameters, assembler?: TabularPropertyAssembler);
    constructor(params: BasicTablePropertyParameters, assembler?: TabularPropertyAssembler) {
        super(params, assembler);
        this.layout = {
            cols: params.layout.cols
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Property Cloning  /////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Clones the property.
     * @returns
     *  The cloned property.
     */
    public override clone(): BasicTableProperty

    /**
     * Clones the property.
     * @param assembler
     *  The cloned property's assembler.
     * @returns
     *  The cloned property.
     */
    public override clone(assembler?: TabularPropertyAssembler): BasicTableProperty {
        // Create property
        let prop = new BasicTableProperty({
            id        : this.id,
            name      : this.name,
            path      : this.path,
            link      : this.link,
            row       : this.row,
            col       : this.col,
            layout: {
                cols  : this.layout.cols
            }
        }, assembler);
        // Clone values
        for(let [id, row] of this._value) {
            prop.insertRow([id, row.map(o => o.clone())]);
        }
        // Clone plugins
        this._plugins?.forEach(({ plugin }) => {
            prop.tryInstallPlugin(plugin);
        });
        // Return
        return prop;
    }

}

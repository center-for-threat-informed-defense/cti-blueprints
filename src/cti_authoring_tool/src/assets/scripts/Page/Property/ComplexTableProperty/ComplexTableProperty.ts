import { Plugin, PluginManager } from "../../Plugins";
import { PlugableElement } from "../../PlugableElement";
import { ComplexTablePropertyLayout } from "./ComplexTablePropertyLayout";
import {
    AtomicProperty,
    ComplexTablePropertyParameters,
    TabularProperty,
    TabularPropertyAssembler
} from "..";

export class ComplexTableProperty extends TabularProperty implements PlugableElement<ComplexTableProperty> {
    
    /**
     * The data region's layout.
     */
    public readonly layout: ComplexTablePropertyLayout;

    /**
     * The table row's collapsed state.
     */
    private _collapsed: Map<string, boolean>;

    /**
     * The property's plugin manager.
     */
    private _plugins: PluginManager<ComplexTableProperty> | null;


    /**
     * The table row's collapsed state.
     */
    public get collapsed(): ReadonlyMap<string, boolean> {
        return this._collapsed;
    }


    /**
     * Creates a new {@link ComplexTableProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: ComplexTablePropertyParameters);
    
    /**
     * Creates a new {@link ComplexTableProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: ComplexTablePropertyParameters, assembler?: TabularPropertyAssembler);
    constructor(params: ComplexTablePropertyParameters, assembler?: TabularPropertyAssembler) {
        super(params, assembler);
        this.layout = {
            summary: params.layout.summary,
            rows: params.layout.rows,
            cols: params.layout.cols
        };
        this._collapsed = new Map();
        this._plugins = null;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Row Collapse Management  //////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Inserts a row into the table property.
     * @param row
     *  The row to insert.
     * @param index
     *  The row's index.
     * @throws { Error }
     *  If `row` does not match the table's structure.
     */
    public override insertRow(row: [string, AtomicProperty[]], index?: number) {
        // Update collapsed state
        this._collapsed.set(row[0], true);
        // Insert row
        super.insertRow(row, index);
    }

    /**
     * Removes a row from the table property.
     * @param index
     *  The row's index.
     * @returns
     *  True if the row was removed, false otherwise.
     */
    public override deleteRow(index: number): boolean;

    /**
     * Removes a row from the table property.
     * @param id
     *  The row's id.
     * @returns
     *  True if the row was removed, false otherwise.
     */
    public override deleteRow(id: string): boolean;
    public override deleteRow(_: string | number): boolean {
        // Update collapsed state
        if(typeof _ === "number") {
            _ = [...this._value.keys()][_];
        }
        if(_ !== undefined) {
            this._collapsed.delete(_);
        }
        // Delete row
        return super.deleteRow(_);
    }

    /**
     * Collapses a row.
     * @param id
     *  The row's id.
     * @param collapse
     *  True to collapse, false to uncollapse. 
     */
    public setRowCollapse(id: string, collapse: boolean) {
        if(this._collapsed.has(id)) {
            this._collapsed.set(id, collapse);
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  2. Property Cloning  /////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Clones the property.
     * @returns
     *  The cloned property.
     */
    public override clone(): ComplexTableProperty;

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
    public override clone(assembler?: TabularPropertyAssembler, excludePlugins?: boolean): ComplexTableProperty;
    public override clone(assembler?: TabularPropertyAssembler, excludePlugins: boolean = false): ComplexTableProperty {
        // Create property
        let prop = new ComplexTableProperty({
            id          : this.id,
            name        : this.name,
            path        : this.path,
            link        : this.link,
            row         : this.row,
            col         : this.col,
            layout: {
                cols    : this.layout.cols,
                rows    : this.layout.rows,
                summary : this.layout.summary
            }
        }, assembler);
        // Clone plugins
        if(!excludePlugins) {
            this._plugins?.forEach(({ plugin }) => prop.tryInstallPlugin(plugin));
        }
        // Clone values
        for(let [id, row] of this._value) {
            prop.insertRow([id, row.map(o => o.clone())]);
            prop.setRowCollapse(id, this._collapsed.get(id)!);
        }
        // Return
        return prop;
    }

    
    ///////////////////////////////////////////////////////////////////////////
    ///  3. Plugin Management  ////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Attempts to install a plugin into the property.
     * @param plugin
     *  The plugin to install.
     * @returns
     *  True if the plugin was successfully installed, false otherwise.
     */
    public tryInstallPlugin(plugin: Plugin<ComplexTableProperty>): boolean {
        let result;
        // Don't allocate manager until absolutely necessary
        if(this._plugins === null) {
            this._plugins = new PluginManager<ComplexTableProperty>(this, this.root);
        }
        result = this._plugins.tryInstallPlugin(plugin);
        // Deallocate manager if no plugins were installed
        if(this._plugins.length === 0) {
            this._plugins = null;
        }
        return result;
    }

    /**
     * Attempts to install a list of plugins into the property.
     * @param plugin
     *  The plugins to install.
     * @returns
     *  True if all plugins were successfully installed, false otherwise.
     */
    public tryInstallPlugins(plugins: Plugin<ComplexTableProperty>[]): boolean {
        let result = true;
        for(let plugin of plugins) {
            result &&= this.tryInstallPlugin(plugin);
        }
        return result;
    }

}

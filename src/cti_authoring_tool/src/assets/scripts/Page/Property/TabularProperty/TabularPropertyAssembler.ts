import { AtomicProperty } from "../AtomicProperty";
import { PropertyAssembler } from "../PropertyAssembler";
import { TabularProperty } from "./TabularProperty";
import { TabularPropertyAccessor } from "./TabularPropertyAccessor";

export class TabularPropertyAssembler extends PropertyAssembler {

    /**
     * The tabular property's accessor.
     */
    private _tabularAccessor: TabularPropertyAccessor | null;


    /**
     * The assembler's property.
     */
    public override get property(): TabularProperty {
        return this.tabularAccessor.property;
    }
    
    /**
     * The tabular property's accessor.
     */
    private get tabularAccessor(): TabularPropertyAccessor {
        if(this._tabularAccessor === null) {
            throw new Error("Assembler is not configured with a tabular property.");
        }
        return this._tabularAccessor;
    }


    /**
     * Creates a new {@link TabularPropertyAssembler}.
     */
    constructor() {
        super();
        this._tabularAccessor = null;
    }


    /**
     * Injects a tabular property's private resources into the assembler.
     * @param accessor
     *  The tabular property's accessor.
     * @remarks
     *  Page API use only. Do not use.
     * @internal
     */
    public __injectTabularAccessor(accessor: TabularPropertyAccessor) {
        this._tabularAccessor = accessor;
    }

    /**
     * Sets the tabular property's default row.
     * @param row
     *  The default row.
     */
    public setDefaultRow(row: AtomicProperty[]) {
        this.tabularAccessor.setDefaultRow(row);
    }

}

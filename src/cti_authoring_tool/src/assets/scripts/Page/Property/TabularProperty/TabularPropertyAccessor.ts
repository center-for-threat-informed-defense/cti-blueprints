import { AtomicProperty } from "../AtomicProperty";
import { TabularProperty } from "./TabularProperty";

export interface TabularPropertyAccessor {
    
    /**
     * The tabular property.
     */
    property: TabularProperty;

    /**
     * Sets the property's default row.
     * @param row
     *  The property's default row.
     */
    setDefaultRow: (row: AtomicProperty[]) => void;

}

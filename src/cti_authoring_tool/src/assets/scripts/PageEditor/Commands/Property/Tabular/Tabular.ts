import { PageCommand } from "../../PageCommand";
import { Sort, TabularProperty } from "@/assets/scripts/Page";
import { MoveTabularPropertyRow } from "./MoveTabularPropertyRow";
import { ReorderTabularProperty } from "./ReorderTabularProperty";
import { CreateTabularPropertyRow } from "./CreateTabularPropertyRow";
import { DeleteTabularPropertyRow } from "./DeleteTabularPropertyRow";

/**
 * Adds a new row to a tabular property.
 * @param prop
 *  The tabular property.
 */
export function createTabularPropertyRow(prop: TabularProperty): PageCommand;

/**
 * Adds a new row to a tabular property.
 * @param prop
 *  The tabular property.
 * @param values
 *  The row's values. 
 */
export function createTabularPropertyRow(prop: TabularProperty, values: { [key: string]: any }): PageCommand;

/**
 * Adds a new row to a tabular property.
 * @param prop
 *  The tabular property.
 * @param values
 *  The row's values. 
 * @param index
 *  The row's index.
 * @returns
 *  A command that represents the action.
 */
export function createTabularPropertyRow(prop: TabularProperty, values?: { [key: string]: any }, index?: number): PageCommand;
export function createTabularPropertyRow(prop: TabularProperty, values?: { [key: string]: any }, index?: number): PageCommand {
    return new CreateTabularPropertyRow(prop, values, index);
}

/**
 * Duplicates a row in a tabular property.
 * @param prop
 *  The tabular property.
 * @param id
 *  The row's id.
 * @returns
 *  A command that represents the action.
 */
export function duplicateTabularPropertyRow(prop: TabularProperty, id: string): PageCommand {
    // Validate that row exists
    let index = prop.getRowIndex(id);
    if(index === -1) {
        throw new Error(`Table row '${ id }' does not exist in '${ prop.id }'.`);
    }
    // Duplicate row
    let values: { [key: string]: any } = {};
    for(let cell of prop.getRow(id)![1]) {
        values[cell.id] = cell.value;
    }
    // Return command
    return new CreateTabularPropertyRow(prop, values, index + 1);
}


/**
 * Deletes a row from a tabular property.
 * @param prop
 *  The tabular property.
 * @param id
 *  The row's id.
 * @returns
 *  A command that represents the action.
 */
export function deleteTabularPropertyRow(prop: TabularProperty, id: string): PageCommand {
    return new DeleteTabularPropertyRow(prop, id);
}

/**
 * Moves a row to a specific location within a tabular property.
 * @param prop
 *  The tabular property.
 * @param id
 *  The row's id.
 * @param dst
 *  The row's new index.
 * @returns
 *  A command that represents the action.
 */
export function moveTabularPropertyRow(prop: TabularProperty, id: string, dst: number): PageCommand {
    return new MoveTabularPropertyRow(prop, id, dst)
}

/**
 * Reorders a tabular property.
 * @param prop
 *  The tabular property.
 * @param id
 *  The id of the column to order on.
 * @param sort
 *  The column's sort order.
 * @returns
 *  A command that represents the action.
 */
export function reorderTabularProperty(prop: TabularProperty, id: string, sort: Sort): PageCommand {
    return new ReorderTabularProperty(prop, id, sort)
}

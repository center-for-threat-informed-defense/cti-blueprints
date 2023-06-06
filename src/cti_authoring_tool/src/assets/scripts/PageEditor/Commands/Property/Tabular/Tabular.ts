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
 * @returns
 *  A command that represents the action.
 */
export function createTabularPropertyRow(prop: TabularProperty): PageCommand {
    return new CreateTabularPropertyRow(prop);
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

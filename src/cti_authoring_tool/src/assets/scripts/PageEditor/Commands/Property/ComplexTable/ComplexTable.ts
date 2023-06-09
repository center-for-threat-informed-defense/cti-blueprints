import { PageCommand } from "../../PageCommand";
import { ComplexTableProperty } from "@/assets/scripts/Page";
import { CollapseComplexTablePropertyRow } from "./CollapseComplexTablePropertyRow";

/**
 * Collapses a complex table property's row.
 * @param prop
 *  The complex table property.
 * @param id
 *  The row's id.
 * @param collapse
 *  True to collapse, false to expand.
 * @returns
 *  A command that represents the action.
 */
export function collapseComplexTablePropertyRow(prop: ComplexTableProperty, id: string, collapse: boolean): PageCommand {
    return new CollapseComplexTablePropertyRow(prop, id, collapse)
}

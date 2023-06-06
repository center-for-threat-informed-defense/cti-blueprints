import { PageCommand } from "../../PageCommand";
import { ComplexTableProperty } from "@/assets/scripts/Page";
import { CollapseComplexTablePropertyRow } from "./CollapseComplexTablePropertyRow";

export function collapseComplexTablePropertyRow(prop: ComplexTableProperty, id: string, collapse: boolean): PageCommand {
    return new CollapseComplexTablePropertyRow(prop, id, collapse)
}

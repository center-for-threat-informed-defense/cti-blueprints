import { PropertyTemplate } from "./PropertyTemplate";
import { Plugin, Section, SectionParameters } from "@/assets/scripts/Page";

export interface SectionTemplate extends SectionParameters {
    properties : PropertyTemplate[];
    plugins?   : Plugin<Section>[]
}

import { Plugins } from "./Plugins";
import { PropertyTemplate } from "./PropertyTemplate";
import { Section, SectionParameters } from "@/assets/scripts/Page";

export interface SectionTemplate extends SectionParameters {
    properties : PropertyTemplate[];
    plugins?   : Plugins<Section>
}

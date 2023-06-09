import { Plugins } from "./Plugins";
import { SectionTemplate } from "./SectionTemplate";
import { Page, PageParameters } from "@/assets/scripts/Page";

export interface PageTemplate extends PageParameters {
    name     : string,
    keys     : string[],
    sections : SectionTemplate[],
    plugins? : Plugins<Page>
}

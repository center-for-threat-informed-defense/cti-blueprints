import { Page, Plugin } from "@/assets/scripts/Page";
import { PageParameters } from "@/assets/scripts/Page/PageParameters";
import { SectionTemplate } from "./SectionTemplate";

export interface PageTemplate extends PageParameters {
    name     : string,
    keys     : string[],
    sections : SectionTemplate[],
    plugins? : Plugin<Page>[]
}

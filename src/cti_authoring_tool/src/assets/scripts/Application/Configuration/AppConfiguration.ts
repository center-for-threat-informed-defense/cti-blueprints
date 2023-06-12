import { AppBranding } from "./AppBranding"
import { DocumentTemplate } from "./DocumentTemplate"

export interface AppConfiguration {
    is_web_hosted: boolean,
    file_type_name: string,
    file_type_extension: string,
    branding: AppBranding,
    templates: DocumentTemplate[],
    menus: {
        help_menu: {
            help_links: { text: string, url: string }[]
        }
    }
}

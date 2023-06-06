import { PageTemplate } from "../PageEditor/PageImporter"

export interface AppConfiguration {
    is_web_hosted: boolean,
    file_type_name: string,
    file_type_extension: string,
    templates: PageTemplate[]
    menus: {
        help_menu: {
            help_links: { text: string, url: string }[]
        }
    }
}

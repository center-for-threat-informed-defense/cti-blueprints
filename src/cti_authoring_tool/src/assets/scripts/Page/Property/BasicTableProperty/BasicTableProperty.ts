import { PageSection } from "../../PageSection";
import { TabularProperty } from "..";
import { IBasicTableProperty } from "./IBasicTableProperty";
import { BasicTablePropertyTemplate, TabularPropertyRowValue } from "../../../AppConfiguration";

export class BasicTableProperty extends TabularProperty implements IBasicTableProperty {

    /**
     * The table's layout.
     */
    public readonly layout: {

        /**
         * The table's number of columns.
         */
        readonly cols: number;

    }
    

    /**
     * Creates a new {@link BasicTableProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @throws { Error }
     *  If `template` defines a non-atomic property.
     */
    constructor(section: PageSection, template: BasicTablePropertyTemplate);
    
    /**
     * Creates a new {@link BasicTableProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @param value
     *  The property's value.
     * @throws { Error }
     *  If `template` defines a non-atomic property.
     */
    constructor(section: PageSection, template: BasicTablePropertyTemplate, value: TabularPropertyRowValue[]) 
    constructor(section: PageSection, template: BasicTablePropertyTemplate, value?: TabularPropertyRowValue[]) {
        if(value === undefined) {
            super(section, template);  
        } else {
            super(section, template, value);  
        }
        this.layout = {
            cols: template.layout.cols
        }
        this.initializePlugins(template);
    }

}

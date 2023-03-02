import { Property } from ".";
import { PageSection } from "../PageSection";
import { AtomicPropertyPlugin } from "../PropertyPlugins/AtomicPropertyPlugin";
import { Alignment, AtomicPropertyTemplate } from "../../AppConfiguration";

export abstract class AtomicProperty extends Property {

    /**
     * If the property is required or not.
     */
    public required: boolean;

    /**
     * The property's alignment.
     */
    public alignment: Alignment;

    /**
     * The property's plugins.
     */
    protected override _plugins: AtomicPropertyPlugin[];


    /**
     * Creates a new {@link AtomicProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     */
    constructor(section: PageSection, template: AtomicPropertyTemplate) {
        super(section, template);
        this._plugins = []
        this.required = template.required ?? true;
        this.alignment = template.alignment ?? Alignment.ML;
    }


    /**
     * Property select behavior.
     */
    public onSelect() {
        // Notify plugins
        for(let plugin of this._plugins) {
            plugin.onSelect();
        }
    }

    /**
     * Property deselect behavior.
     */
    public onDeselect() {
        // Notify plugins
        for(let plugin of this._plugins) {
            plugin.onDeselect();
        }
    }

}

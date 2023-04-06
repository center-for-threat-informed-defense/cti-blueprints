import { Property } from "..";
import { PageSection } from "../../PageSection";
import { IAtomicProperty } from "./IAtomicProperty";
import { Alignment, AtomicPropertyTemplate } from "../../../AppConfiguration";

export abstract class AtomicProperty extends Property implements IAtomicProperty {

    /**
     * If the property is required or not.
     */
    public readonly required: boolean;

    /**
     * The property's alignment.
     */
    public readonly alignment: Alignment;


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
        this.alignment = template.alignment ?? Alignment.TopLeft;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Event Methods  ////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Property select behavior.
     */
    public onSelect() {
        super.emit("select");
        this._section.onSelect(this);
    }

    /**
     * Property deselect behavior.
     */
    public onDeselect() {
        super.emit("deselect");
        this._section.onDeselect(this);
    }

}

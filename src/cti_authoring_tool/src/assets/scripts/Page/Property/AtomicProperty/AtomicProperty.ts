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
     * The property's metrics.
     */
    protected _metrics: any[];


    /**
     * Creates a new {@link AtomicProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     */
    constructor(section: PageSection, template: AtomicPropertyTemplate) {
        super(section, template);
        this.required = template.required ?? true;
        this.alignment = template.alignment ?? Alignment.TopLeft;
        this._metrics = [];
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. IAtomicProperty Methods  //////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Registers a property metric.
     * @param name
     *  The metric's name.
     * @param metric
     *  The metric.
     */
    public registerMetric(name: string, metric: () => any): void {
        // TODO: Implement metric registration
        throw new Error("Method not implemented.");
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  2. Event Methods  ////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Property select behavior.
     */
    public onSelect() {
        super.emit("select");
        this._section.onPropertySelect(this);
    }

    /**
     * Property deselect behavior.
     */
    public onDeselect() {
        super.emit("deselect");
        this._section.onPropertyDeselect(this);
    }

}

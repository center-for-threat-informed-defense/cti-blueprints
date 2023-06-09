import { AtomicProperty, EnumProperty, StringProperty, TabularProperty } from "@/assets/scripts/Page";

export class MitreDefendPlugin {

    /**
     * The tabular property.
     */
    private property: TabularProperty;
    
    /**
     * Technique update behavior.
     * @param prop
     *  The technique property.
     * @remarks
     *  Bound to `this`.
     */
    private onTechniqueUpdate: (property: EnumProperty) => void;


    /**
     * Creates a new {@link MitreDefendPlugin}.
     * @param property
     *  The tabular property.
     */
    constructor(property: TabularProperty) {
        this.property = property;
        // Setup event listeners
        this.onTechniqueUpdate = this._onTechniqueUpdate.bind(this);
        // Setup row event handlers
        property.on("insert-row", (_: any, row: AtomicProperty[]) => this.subscribeRow(row));
        property.on("delete-row", (_: any, row: AtomicProperty[]) => this.unsubscribeRow(row));
    }


    /**
     * Subscribes to a row's technique and sub-techniques fields.
     * @param row
     *  The row to subscribe to.
     */
    private subscribeRow(row: AtomicProperty[]) {
        // Get relevant properties
        let [technique, subTechnique] = this.getAttackFieldsFromRow(row);
        // Setup property event listeners
        technique.on("update", this.onTechniqueUpdate);
        subTechnique.on("update", this.onTechniqueUpdate);
        // Update defend property, if necessary
        this._onTechniqueUpdate(row[0]);
    }

    /**
     * Unsubscribes from a row's technique and sub-techniques fields.
     * @param row
     *  The row to unsubscribe from.
     */
    private unsubscribeRow(row: AtomicProperty[]) {
        // Get relevant properties
        let [technique, subTechnique] = this.getAttackFieldsFromRow(row);
        // Remove property event listeners
        technique.off("update", this.onTechniqueUpdate);
        subTechnique.off("update", this.onTechniqueUpdate);
    }

    /**
     * Technique update behavior.
     * @param prop
     *  The technique property.
     */
    private _onTechniqueUpdate(prop: AtomicProperty) {
        // Get relevant properties
        let [technique, subTechnique, defend] = this.lookupAttackFields(prop);
        // Set defend property's value
        if(subTechnique.value) {
            defend.value = `https://d3fend.mitre.org/offensive-technique/attack/${ subTechnique.value }/`;
            return;
        }
        if(technique.value) {
            defend.value = `https://d3fend.mitre.org/offensive-technique/attack/${ technique.value }/`;
            return;
        }
        defend.value = "";
    }

    /**
     * Returns the ATT&CK properties associated with a row property.
     * @param prop
     *  The row property.
     * @returns
     *  The associated technique, sub-technique, and defend properties.
     */
    private lookupAttackFields(prop: AtomicProperty): [EnumProperty, EnumProperty, StringProperty] {
        // Lookup row
        let row: AtomicProperty[];
        for(let r of this.property.value.values()) {
            if(r.includes(prop)) {
                row = r;
                break;
            }
        }
        // Return fields
        return this.getAttackFieldsFromRow(row!);
    }

    /**
     * Returns the ATT&CK properties from a table row.
     * @param row
     *  The table row.
     * @returns
     *  The technique, sub-technique, and defend properties.
     */
    public getAttackFieldsFromRow(row: AtomicProperty[]): [EnumProperty, EnumProperty, StringProperty] {
        return [
            row.find(o => o.id === "technique")! as EnumProperty,
            row.find(o => o.id === "sub_technique")! as EnumProperty,
            row.find(o => o.id === "defend")! as StringProperty
        ]
    }

}

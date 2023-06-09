import { AtomicProperty, EnumProperty, TabularProperty } from "@/assets/scripts/Page";
import { TacticMap, TechniquesMap } from "./MitreAttackMaps";

export class MitreAttackSmartDropdownsPlugin {

    /**
     * The tabular property.
     */
    private property: TabularProperty;

    /**
     * Tactic update behavior.
     * @param prop
     *  The tactic property.
     * @remarks
     *  Bound to `this`.
     */
    private onTacticUpdate: (property: EnumProperty) => void;
    
    /**
     * Technique update behavior.
     * @param prop
     *  The technique behavior.
     * @remarks
     *  Bound to `this`.
     */
    private onTechniqueUpdate: (property: EnumProperty) => void;


    /**
     * Creates a new {@link MitreAttackSmartDropdownsPlugin}.
     * @param property
     *  The tabular property.
     */
    constructor(property: TabularProperty) {
        this.property = property;
        // Setup event listeners
        this.onTacticUpdate = this._onTacticUpdate.bind(this);
        this.onTechniqueUpdate = this._onTechniqueUpdate.bind(this);
        // Setup row event handlers
        property.on("insert-row", (_: any, row: AtomicProperty[]) => this.subscribeRow(row));
        property.on("delete-row", (_: any, row: AtomicProperty[]) => this.unsubscribeRow(row));
    }


    /**
     * Subscribes to a row's tactic and technique fields.
     * @param row
     *  The row to subscribe to.
     */
    private subscribeRow(row: AtomicProperty[]) {
        // Get relevant properties
        let [tactic, technique] = this.getAttackFieldsFromRow(row);
        // Setup property event listeners
        tactic.on("update", this.onTacticUpdate);
        technique.on("update", this.onTechniqueUpdate);
        // Update restrictions, if necessary
        this._onTacticUpdate(row[0]);
        this._onTechniqueUpdate(row[0]);
    }

    /**
     * Unsubscribes from a row's tactic and technique fields.
     * @param row
     *  The row to unsubscribe from.
     */
    private unsubscribeRow(row: AtomicProperty[]) {
        // Get relevant properties
        let [tactic, technique] = this.getAttackFieldsFromRow(row);
        // Remove property event listeners
        tactic.off("update", this.onTacticUpdate);
        technique.off("update", this.onTechniqueUpdate);
    }

    /**
     * Tactic update behavior.
     * @param prop
     *  The tactic property.
     */
    private _onTacticUpdate(prop: AtomicProperty) {
        // Get relevant properties
        let [tac, tec, sub] = this.lookupAttackFields(prop);
        // Update technique and sub-technique restrictions
        this.updateTechniqueRestrictions(tac, tec);
        this.updateSubTechniqueRestrictions(tac, tec, sub);
    }

    /**
     * Technique update behavior.
     * @param prop
     *  The technique behavior.
     */
    private _onTechniqueUpdate(prop: AtomicProperty) {
        // Get relevant properties
        let [tac, tec, sub] = this.lookupAttackFields(prop);
        // Update sub-technique restrictions
        this.updateSubTechniqueRestrictions(tac, tec, sub);
    }

    /**
     * Updates a technique's restrictions.
     * @param tac
     *  The tactic property.
     * @param tec
     *  The technique property.
     */
    private updateTechniqueRestrictions(tac: EnumProperty, tec: EnumProperty,) {
        // If tactic is set
        if(tac.value !== null) {
            let techniques = TacticMap[tac.value];
            tec.restrictOptions(techniques);
        }
        // If tactic is not set
        else {
            tec.unrestrictOptions();
        }   
    }

    /**
     * Updates a sub-technique's restrictions.
     * @param tac
     *  The tactic property.
     * @param tec
     *  The technique property.
     * @param sub
     *  The sub-technique property.
     */
    private updateSubTechniqueRestrictions(tac: EnumProperty, tec: EnumProperty, sub: EnumProperty) {
        // If technique is set
        if(tec.value !== null) {
            let subTechniques = TechniquesMap[tec.value];
            if(!subTechniques) {
                sub.restrictOptions([]);
            } else {
                subTechniques = subTechniques.map(o => `${ tec.value }.${ o }`);
                sub.restrictOptions(subTechniques);
            }
        }
        // If tactic is set
        else if(tac.value !== null) {
            let techniques = TacticMap[tac.value];
            tec.restrictOptions(techniques);
            // Sub-techniques
            let subTechniques: string[] = [];
            for(let technique of techniques) {
                if(!(technique in TechniquesMap)) {
                   continue; 
                }
                subTechniques = subTechniques.concat(
                    TechniquesMap[technique]
                        .map(o => `${ technique }.${ o }`)
                );
            }
            sub.restrictOptions(subTechniques);
        }
        // If neither are set
        else {
            sub.unrestrictOptions();
        }
    }

    /**
     * Returns the ATT&CK properties associated with a row property.
     * @param prop
     *  The row property.
     * @returns
     *  The associated tactic, technique, and sub-technique properties.
     */
    private lookupAttackFields(prop: AtomicProperty): EnumProperty[] {
        // Lookup row
        let row: AtomicProperty[];
        for(let r of this.property.value.values()) {
            if(r.includes(prop)) {
                row = r;
                break;
            }
        }
        return this.getAttackFieldsFromRow(row!);
    }

    /**
     * Returns the ATT&CK properties from a table row.
     * @param row
     *  The table row.
     * @returns
     *  The tactic, technique, and sub-technique properties.
     */
    public getAttackFieldsFromRow(row: AtomicProperty[]): EnumProperty[] {
        return [
            row.find(o => o.id === "tactic")! as EnumProperty,
            row.find(o => o.id === "technique")! as EnumProperty,
            row.find(o => o.id === "sub_technique")! as EnumProperty
        ]
    }

}

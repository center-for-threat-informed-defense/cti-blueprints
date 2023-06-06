import { PropertyAccessor } from "./PropertyAccessor";
import { SectionAssembler } from "../Section/SectionAssembler";
import { Property, TabularPropertyAssembler } from ".";

export class PropertyAssembler {

    /**
     * The property's accessor.
     */
    private _accessor: PropertyAccessor | null;

    /**
     * The assembler's parent.
     */
    private _parentAssembler: SectionAssembler | TabularPropertyAssembler | null;


    /**
     * The assembler's property.
     */
    public get property(): Property {
        return this.accessor.property;
    }

    /**
     * The assembler's parent.
     */
    public get parent(): SectionAssembler | TabularPropertyAssembler | null {
        return this._parentAssembler;
    }

    /**
     * The property's accessor.
     */
    private get accessor(): PropertyAccessor {
        if(this._accessor === null) {
            throw new Error("Assembler is not configured with a property.");
        }
        return this._accessor;
    }

        
    /**
     * Creates a new {@link PropertyAssembler}.
     */
    constructor() {
        this._accessor = null;
        this._parentAssembler = null;
    }


    /**
     * Injects a property's private resources into the assembler.
     * @param accessor
     *  The property's accessor.
     * @remarks
     *  Page API use only. Do not use.
     * @internal
     */
    public __injectAccessor(accessor: PropertyAccessor) {
        this._accessor = accessor;
    }

    /**
     * Adds the property to a section.
     * @param asm
     *  The section's assembler.
     */
    public attachToSection(asm: SectionAssembler) {
        // Validate
        if(this.belongsToParent(asm)) {
            return;
        }
        // Detach existing parent, if needed
        if(this.belongsToParent()) {
            this.detachFromParent();
        }
        // Attach parent
        this.accessor.setParent(asm.section);
        this._parentAssembler = asm;
        // Attach property
        asm.attachProperty(this);
    }

    /**
     * Adds the property to a tabular property.
     * @param asm
     *  The tabular property's assembler.
     * @remarks
     *  This function is designed to support `TabularProperty` (a property
     *  which contains subproperties). Because the assembler has no control
     *  over a property's children, {@link detachFromParent} must be invoked 
     *  with caution. It can only disconnect a subproperty's upward
     *  relationship to its parent, not its downward one. This function will be
     *  removed or heavily refactored in the future.
     */
    public attachToTabularProperty(asm: TabularPropertyAssembler) {
        // Validate
        if(this.belongsToParent(asm)) {
            return;
        }
        // Detach existing parent, if needed
        if(this.belongsToParent()) {
            this.detachFromParent();
        }
        // Attach parent
        this.accessor.setParent(asm.property);
        this._parentAssembler = asm;
    }

    /**
     * Removes the property from its current parent.
     */
    public detachFromParent() {
        // Validate
        if(!this.belongsToParent()) {
            return;
        }
        let parent = this._parentAssembler;
        // Detach parent
        this.accessor.setParent(null);
        this._parentAssembler = null;
        // Detach property, if needed
        if(parent instanceof SectionAssembler) {
            parent.detachProperty(this);
        }
    }

    /**
     * Tests if the property belongs to a parent.
     * @returns
     *  True if the property belongs to a parent, false otherwise.
     */
    public belongsToParent(): boolean;

    /**
     * Tests if the property belongs to the given parent.
     * @param asm
     *  The parent's assembler.
     * @returns
     *  True if the property belongs to the given parent, false otherwise.
     */
    public belongsToParent(asm: SectionAssembler | TabularPropertyAssembler): boolean;
    public belongsToParent(asm?: SectionAssembler | TabularPropertyAssembler): boolean {
        let parent = this.accessor.getParent();
        if(parent === null) {
            return false;
        } else if(asm === undefined) {
            return true;
        }
        let instance;
        if(asm instanceof SectionAssembler) {
            instance = asm.section.instance;
        } else {
            instance === asm.property.instance;
        }
        return parent.instance === instance;
    }

}

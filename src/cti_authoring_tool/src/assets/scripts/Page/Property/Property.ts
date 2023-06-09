import { Section } from "../Section/Section";
import { PageElement } from "../PageElement";
import { PropertyAssembler } from "./PropertyAssembler";
import { PropertyParameters } from "./PropertyParameters";
import { PropertyAction, PropertyActionText } from "./PropertyAction";

export abstract class Property extends PageElement {

    /**
     * The property's id.
     */
    public readonly id: string;

    /**
     * The property's name.
     */
    public readonly name: string;

    /**
     * The property's export path.
     */
    public readonly path: string;

    /**
     * The property's help link.
     */
    public readonly link: string | null;

    /**
     * The property's row.
     */
    public readonly row: number | [number, number];

    /**
     * The property's column.
     */
    public readonly col: number | [number, number];

    /**
     * The property's actions
     */
    protected _actions: Map<string, PropertyAction> | null;

    
    /**
     * The property's actions.
     */
    public get actions(): ReadonlyMap<string, PropertyActionText> | null {
        return this._actions;
    }


    /**
     * Creates a new {@link Property}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: PropertyParameters);
    
    /**
     * Creates a new {@link Property}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: PropertyParameters, assembler?: PropertyAssembler);
    constructor(params: PropertyParameters, assembler?: PropertyAssembler) {
        super();
        // Configure state
        this.id = params.id;
        this.path = params.path ?? params.id;
        this.name = params.name;
        this.link = params.link ?? null;
        this.row = params.row;
        this.col = params.col;
        this._parent = null;
        this._actions = null;
        // Configure assembler
        if(assembler) {
            this.__prepareAssembler(assembler);
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Action Management  ////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    
    /**
     * Registers a property action.
     * @param id
     *  The action's id.
     * @param name
     *  The action's text.
     * @param func
     *  The action.
     */
    public registerAction(id: string, text: string, func: () => void): void {
        // Don't allocate Map until absolutely necessary
        if(this._actions === null) {
            this._actions = new Map();
        }
        this._actions.set(id, { text, function: func });
    }

    /**
     * Invokes a property action.
     * @param id
     *  The action's id.
     */
    public invokeAction(id: string) {
        if(this._actions === null || !this._actions.has(id)) {
            throw new Error(`'${ id }' is not a registered action.`);
        } else {
            this._actions.get(id)!.function();
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  2. Property Cloning  /////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Clones the property.
     * @returns
     *  The cloned property.
     */
    public abstract override clone(): Property;

    /**
     * Clones the property.
     * @param assembler
     *  The cloned property's assembler.
     * @returns
     *  The cloned property.
     */
    public abstract override clone(assembler?: PropertyAssembler): Property;


    ///////////////////////////////////////////////////////////////////////////
    ///  3. Assembler Preparation  ////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Prepares an assembler for the property.
     * @returns
     *  The property's assembler.
     * @remarks
     *  Page API use only. Do not use.
     * @internal
     */
    public __prepareAssembler(): PropertyAssembler

    /**
     * Prepares an assembler for the property.
     * @param assembler
     *  The assembler to use.
     * @returns
     *  The property's assembler.
     * @remarks
     *  Page API use only. Do not use.
     * @internal
     */
    public __prepareAssembler(assembler?: PropertyAssembler): PropertyAssembler;
    public __prepareAssembler(assembler: PropertyAssembler = new PropertyAssembler()): PropertyAssembler {
        assembler.__injectAccessor({
            property: this,
            getParent: () => this._parent,
            setParent: (p: Section | Property | null) => this._parent = p
        });
        return assembler;
    }

}

import { Property } from "..";
import { Alignment } from "./Alignment";
import { PropertyAssembler } from "../PropertyAssembler";
import { AtomicPropertyMetric } from "./AtomicPropertyMetric";
import { AtomicPropertyParameters } from "./AtomicPropertyParameters";

export abstract class AtomicProperty extends Property {

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
    protected _metrics: Map<string, AtomicPropertyMetric>;


    /**
     * The property's metrics.
     */
    public get metrics(): ReadonlyMap<string, AtomicPropertyMetric> {
        return this._metrics;
    }

    
    /**
     * Creates a new {@link AtomicProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: AtomicPropertyParameters);

    /**
     * Creates a new {@link AtomicProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: AtomicPropertyParameters, assembler?: PropertyAssembler);
    constructor(params: AtomicPropertyParameters, assembler?: PropertyAssembler) {
        super(params, assembler);
        this.required = params.required ?? false;
        this.alignment = params.alignment ?? Alignment.TopLeft;
        this._metrics = new Map();
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Metric Management  ////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Registers a property metric.
     * @param id
     *  The metric's id.
     * @param text
     *  The metric's text.
     * @param value
     *  The metric's initial value.
     */
    public registerMetric(id: string, text: string, value: string | number | boolean): void {
        this._metrics.set(id, { text, value });
    }

    /**
     * Updates a property metric.
     * @param id
     *  The metric's id.
     * @param value
     *  The metric's new value.
     */
    public updateMetric(id: string, value: string | number | boolean) {
        if(!this._metrics.has(id)) {
            throw new Error(`'${ id }' is not a registered metric.`);
        } else {
            this._metrics.get(id)!.value = value;
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
    public abstract override clone(): AtomicProperty;

    /**
     * Clones the property.
     * @param assembler
     *  The cloned property's assembler.
     * @returns
     *  The cloned property.
     */
    public abstract override clone(assembler?: PropertyAssembler): AtomicProperty;

}

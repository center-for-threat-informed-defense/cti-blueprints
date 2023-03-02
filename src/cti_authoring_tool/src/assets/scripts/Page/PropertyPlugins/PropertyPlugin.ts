import { Property } from "../Property/Property";

export abstract class PropertyPlugin {

    /**
     * Creates a new {@link PropertyPlugin}.
     */
    constructor() {}


    public abstract onInit(): void;

    public abstract onUpdate(): void;

    public abstract onMount(el: HTMLElement): void;

    public abstract onDestroy(): void;

    protected registerAction() {

    }

    protected registerMetric() {

    }

    protected newCommand() {

    }

}
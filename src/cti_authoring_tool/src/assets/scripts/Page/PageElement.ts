import * as Crypto from "@/assets/scripts/Utilities";
import { EventEmitter } from "./Events/EventEmitter";

export abstract class PageElement extends EventEmitter {

    /**
     * The page element's instance id.
     */
    public readonly instance: string;

    /**
     * The page element's parent.
     */
    protected _parent: PageElement | null;


    /**
     * The page element's root instance id.
     */
    public get rootInstance(): string {
        return this.root.instance;
    }

    /**
     * The page element's root.
     */
    protected get root(): PageElement {
        let root: PageElement = this;
        while(root._parent !== null) {
            root = root._parent;
        }
        return root
    }


    /**
     * Creates a new {@link PageElement}.
     */
    constructor() {
        super();
        this.instance = Crypto.randomUUID();
        this._parent = null;
    }


    /**
     * Clones the element.
     * @returns
     *  The cloned element.
     */
    public abstract clone(): PageElement;

}

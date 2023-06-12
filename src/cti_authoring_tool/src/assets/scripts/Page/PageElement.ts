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


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Property Cloning  /////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Clones the element.
     * @returns
     *  The cloned element.
     */
    public abstract clone(): PageElement;


    ///////////////////////////////////////////////////////////////////////////
    ///  2. Emit Upward  //////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Emits an event up through the element's parent chain.
     * @param event
     *  The name of the event to raise.
     * @param args
     *  The arguments to pass to the event listeners.
     */
    public emitUpward(event: string, ...args: any[]): void {
        this.emit(event, ...args);
        this._parent?.emitUpward(event, ...args);
    }

}

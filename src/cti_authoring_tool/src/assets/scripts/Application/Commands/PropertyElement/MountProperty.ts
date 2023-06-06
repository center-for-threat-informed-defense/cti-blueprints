
import { Property } from "@/assets/scripts/Page";
import { AppCommand } from "../AppCommand";

export class MountProperty extends AppCommand {

    /**
     * The property to mount.
     */
    private _property: Property;

    /**
     * The property's HTML container.
     */
    private _el: HTMLElement;


    /**
     * Mounts a property to the DOM.
     * @param property
     *  The property to mount.
     * @param el
     *  The property's HTML container.
     */
    constructor(property: Property, el: HTMLElement) {
        super();
        this._property = property;
        this._el = el;
    }
    

    /**
     * Executes the command.
     */
    public execute(): void {
        this._property.emit("mount", this._el);
    }

}

import { AppCommand } from "../AppCommand";
import { PageSection } from "../../Page/PageSection";

export class MountPageSection extends AppCommand {

    /**
     * The section to mount.
     */
    private _section: PageSection;

    /**
     * The section's HTML container.
     */
    private _el: HTMLElement;


    /**
     * Mounts a section to the DOM.
     * @param section
     *  The section to mount.
     * @param el
     *  The section's HTML container.
     */
    constructor(section: PageSection, el: HTMLElement) {
        super();
        this._section = section;
        this._el = el;
    }
    

    /**
     * Executes the command.
     */
    public execute(): void {
        this._section.onMount(this._el);
    }

}

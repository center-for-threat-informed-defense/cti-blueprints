import { Section } from "@/assets/scripts/Page";
import { AppCommand } from "../AppCommand";

export class MountSection extends AppCommand {

    /**
     * The section to mount.
     */
    private _section: Section;

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
    constructor(section: Section, el: HTMLElement) {
        super();
        this._section = section;
        this._el = el;
    }
    

    /**
     * Executes the command.
     */
    public execute(): void {
        this._section.emit("mount", this._el);
    }

}

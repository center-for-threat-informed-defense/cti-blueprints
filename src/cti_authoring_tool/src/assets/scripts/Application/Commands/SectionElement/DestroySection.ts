import { Section } from "@/assets/scripts/Page";
import { AppCommand } from "../AppCommand";

export class DestroySection extends AppCommand {

    /**
     * The section to destroy.
     */
    private _section: Section;


    /**
     * Removes a section from the DOM.
     * @param section
     *  The section to destroy.
     */
    constructor(section: Section) {
        super();
        this._section = section;
    }
    

    /**
     * Executes the command.
     */
    public execute(): void {
        this._section.emit("destroy");
    }

}

import { AppCommand } from "../AppCommand";
import { PageSection } from "../../Page/PageSection";

export class DestroyPageSection extends AppCommand {

    /**
     * The section to destroy.
     */
    private _section: PageSection;


    /**
     * Removes a section from the DOM.
     * @param section
     *  The section to destroy.
     */
    constructor(section: PageSection) {
        super();
        this._section = section;
    }
    

    /**
     * Executes the command.
     */
    public execute(): void {
        this._section.onDestroy();
    }

}

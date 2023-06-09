import * as PageCommands from "@/assets/scripts/PageEditor/Commands"
import { Browser } from "@/assets/scripts/Utilities/Browser";
import { PageElement, TabularProperty } from "@/assets/scripts/Page";
import { getTacticFromTechnique, getTechniqueFromSubTechnique } from "./MitreAttackMaps";

export class MitreAttackFlowPlugin {
    
    /**
     * Tactic Regex
     */
    private static TACTIC_REGEX = /TA[0-9]{4}/i;

    /**
     * Technique and Sub-technique Regex
     */
    private static TECHNIQUE_REGEX = /(T[0-9]{4}\.[0-9]{3})|(T[0-9]{4})/i;


    /**
     * Creates a new {@link MitreAttackFlowPlugin}.
     * @param property
     *  The tabular property.
     */
    constructor(property: TabularProperty, page: PageElement) {
        // Register "Import from Attack Flow" action
        property.registerAction("import-attack-flow", "Import from Attack Flow", () => { 
            Browser.openTextFileDialog().then(file => {
                let { contents } = file;
                // Validate contents
                if(contents === null || contents === undefined) {
                    console.error(`Error: could not contents of file: '${ file.filename }'.`);
                }
                // Parse contents
                let json = JSON.parse(contents as string);
                let objs = this.extractMitreAttackData(json);
                // Format commands
                let commands = []
                for(let obj of objs) {
                    commands.push(PageCommands.createTabularPropertyRow(property, obj));
                }
                // Execute commands
                page.emit("execute", ...commands);
            });
        });
    }


    /**
     * Extracts ATT&CK data from a published Attack Flow file.
     * @param file
     *  The Attack Flow file.
     * @returns
     *  The ATT&CK data.
     */
    private extractMitreAttackData(file: any): any[] {
        let match;
        let tacticRegex = MitreAttackFlowPlugin.TACTIC_REGEX;
        let techniqueRegex = MitreAttackFlowPlugin.TECHNIQUE_REGEX;
        let results = [];
        for(let objects of file.objects ?? []) {
            if(objects.type !== "attack-action") {
                continue;
            }
            if(objects.technique_id) {
                if(match = techniqueRegex.exec(objects.technique_id)) {
                    
                    // If regex matches sub-technique identifier
                    if(match[1]) {
                        let sub_technique = match[1].toLocaleUpperCase();
                        let technique = getTechniqueFromSubTechnique(sub_technique)!;
                        let tactic = getTacticFromTechnique(technique)!;
                        results.push({ 
                            tactic,
                            technique,
                            sub_technique
                        });
                        continue;
                    }
                    
                    // If regex matches technique identifier
                    if(match[2]) {
                        let technique = match[2].toLocaleUpperCase();
                        let tactic = getTacticFromTechnique(technique)!;
                        results.push({
                            tactic,
                            technique 
                        });
                        continue;
                    }
                    
                }
            }
            if(objects.tactic_id) {
                if(match = tacticRegex.exec(objects.tactic_id)) {
                    results.push({
                        tactic: match[0].toLocaleUpperCase()
                    });
                }
            }
        }
        return results;
    }

}

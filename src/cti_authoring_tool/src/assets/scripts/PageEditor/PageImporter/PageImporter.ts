import * as Json from "@/assets/scripts/Utilities/Json";
import * as PageExporter from "../PageExporter";
import { 
    Page,
    Section,
    EnumProperty,
    StringProperty,
    DateTimeProperty,
    FloatProperty,
    IntegerProperty,
    PageAssembler,
    DateProperty,
    TimeProperty,
    PropertyAssembler,
    SectionAssembler,
    BasicTableProperty,
    TabularPropertyAssembler,
    AtomicProperty,
    ComplexTableProperty
} from "../../Page";
import {
    PageTemplate,
    PropertyType,
    SectionTemplate,
    PropertyTemplate,
    BasicTablePropertyTemplate,
    ComplexTablePropertyTemplate,
    StringPropertyTemplate,
    NumberPropertyTemplate,
    DateTimePropertyTemplate,
    EnumPropertyTemplate
} from "./Templates";

/**
 * Creates a new {@link PageAssembler} from a {@link PageTemplate}.
 * @param template
 *  The page's template.
 * @param path
 *  The current lookup path.
 * @param values
 *  The page's values.
 * @returns
 *  The page's assembler.
 */
export function newPage(
    template: PageTemplate, path?: string, values?: any
): PageAssembler {
    // Construct Page
    let assembler = new PageAssembler();
    let page = new Page(template, assembler);
    // Resolve path
    path = resolveLookupPath(path, page.path);
    // Construct Sections
    for(let s of template.sections) {
        let section = newSection(s, path, values);
        assembler.attachSection(section);
    }
    // Install Plugins
    page.tryInstallPlugins(template.plugins ?? []);
    // Return assembler
    return assembler;
}

/**
 * Creates a new {@link SectionAssembler} from a {@link SectionTemplate}.
 * @param template
 *  The section's template.
 * @param path
 *  The current lookup path.
 * @param values
 *  The page's values.
 * @returns
 *  The section's assembler.
 */
export function newSection(
    template: SectionTemplate, path?: string, values?: any
): SectionAssembler {
    // Construct Section
    let assembler = new SectionAssembler();
    let section = new Section(template, assembler);
    // Resolve path
    path = resolveLookupPath(path, section.path);
    // Construct Properties
    for(let p of template.properties) {
        let property = newProperty(p, path, values);
        assembler.attachProperty(property);
    }
    // Install Plugins
    section.tryInstallPlugins(template.plugins ?? []);
    // Return assembler
    return assembler;
}

/**
 * Creates a new {@link PropertyAssembler} from a {@link PropertyTemplate}.
 * @param template
 *  The property's template.
 * @param path
 *  The current lookup path.
 * @param values
 *  The page's values.
 * @returns
 *  The property's assembler.
 */
export function newProperty(
    template: PropertyTemplate, path?: string, values?: any
): PropertyAssembler {
    // Create property
    switch(template.type) {
        case PropertyType.String:
            return newStringProperty(template, path, values);
        case PropertyType.Integer:  
        case PropertyType.Float:
            return newNumberProperty(template, path, values);
        case PropertyType.Date:
        case PropertyType.Time:
        case PropertyType.DateTime:
            return newDateTimeProperty(template, path, values);
        case PropertyType.Enum:
            return newEnumProperty(template, path, values);
        case PropertyType.BasicTable:
        case PropertyType.ComplexTable:
            return newTabularProperty(template, path, values);
        
    }
}

/**
 * Creates a new {@link PropertyAssembler} from a
 * {@link StringPropertyTemplate}.
 * @param template
 *  The property's template.
 * @param path
 *  The current lookup path.
 * @param values
 *  The page's values.
 * @returns
 *  The property's assembler.
 */
function newStringProperty(
    template: StringPropertyTemplate, path?: string, values?: any
): PropertyAssembler {
    
    // Create property
    let assembler = new PropertyAssembler();
    let prop = new StringProperty(template, assembler);
    if(template.suggestions) {
        prop.suggestions = template.suggestions;
    }
    
    // Resolve value
    path = resolveLookupPath(path, prop.path);
    let value = Json.lookup(path, values);
    if(value !== undefined) {
        prop.value = value;
    } else if(template.default !== undefined) {
        prop.value = template.default;
    }
    
    // Install plugins
    prop.tryInstallPlugins(template.plugins ?? []);
    
    // Return assembler
    return assembler;

}

/**
 * Creates a new {@link PropertyAssembler} from a
 * {@link NumberPropertyTemplate}.
 * @param template
 *  The property's template.
 * @param path
 *  The current lookup path.
 * @param values
 *  The page's values.
 * @returns
 *  The property's assembler.
 */
function newNumberProperty(
    template: NumberPropertyTemplate, path?: string, values?: any
): PropertyAssembler {
    
    // Create property
    let assembler = new PropertyAssembler();
    let prop;
    switch(template.type) {
        case PropertyType.Float:
            prop = new FloatProperty(template, assembler); 
            break;
        case PropertyType.Integer:
            prop = new IntegerProperty(template, assembler);
            break;
    }
    
    // Resolve value
    path = resolveLookupPath(path, prop.path);
    let value = Json.lookup(path, values);
    if(value !== undefined) {
        prop.value = value;
    } else if(template.default !== undefined) {
        prop.value = template.default;
    }
    
    // Install plugins
    prop.tryInstallPlugins(template.plugins ?? []);
    
    // Return assembler
    return assembler;

}

/**
 * Creates a new {@link PropertyAssembler} from a
 * {@link DateTimePropertyTemplate}.
 * @param template
 *  The property's template.
 * @param path
 *  The current lookup path.
 * @param values
 *  The page's values.
 * @returns
 *  The property's assembler.
 */
function newDateTimeProperty(
    template: DateTimePropertyTemplate, path?: string, values?: any
): PropertyAssembler {
    
    // Create property
    let assembler = new PropertyAssembler();
    let prop;
    switch(template.type) {
        case PropertyType.Time:
            prop = new TimeProperty(template, assembler);
            break;
        case PropertyType.Date:
            prop = new DateProperty(template, assembler); 
            break;
        case PropertyType.DateTime:
            prop = new DateTimeProperty(template, assembler);
    }
    
    // Resolve value
    path = resolveLookupPath(path, prop.path);
    let value = Json.lookup(path, values);
    if(value !== undefined) {
        prop.value = value;
    } else if(template.default !== undefined) {
        prop.value = template.default;
    }
    
    // Install plugins
    prop.tryInstallPlugins(template.plugins ?? []);
    
    // Return assembler
    return assembler;

}

/**
 * Creates a new {@link PropertyAssembler} from a {@link EnumPropertyTemplate}.
 * @param template
 *  The property's template.
 * @param path
 *  The current lookup path.
 * @param values
 *  The page's values.
 * @returns
 *  The property's assembler.
 */
function newEnumProperty(
    template: EnumPropertyTemplate, path?: string, values?: any
): PropertyAssembler {

    // Create property
    let assembler = new PropertyAssembler();
    let prop = new EnumProperty(template, assembler);
    
    // Resolve value
    path = resolveLookupPath(path, prop.path);
    let value = Json.lookup(path, values);
    if(value !== undefined) {
        prop.value = value;
    } else if(template.default !== undefined) {
        prop.value = template.default;
    }
    
    // Install plugins
    prop.tryInstallPlugins(template.plugins ?? []);
    
    // Return assembler
    return assembler;

}

/**
 * Creates a new {@link TabularProperty} from a tabular template.
 * @param template
 *  The property's template.
 * @param path
 *  The current lookup path.
 * @param values
 *  The page's values.
 * @returns
 *  The property's assembler.
 */
function newTabularProperty(
    template: BasicTablePropertyTemplate | ComplexTablePropertyTemplate, path?: string, values?: any
): PropertyAssembler {
    
    // Create property
    let assembler = new TabularPropertyAssembler();
    let prop;
    switch(template.type) { 
        case PropertyType.BasicTable:
            prop = new BasicTableProperty(template, assembler); 
            break;   
        case PropertyType.ComplexTable:
            prop = new ComplexTableProperty(template, assembler);
            break;
    }
    
    // Configure default row
    let defaultRow: AtomicProperty[] = [];
    for(let prop of template.properties) {
        let cell = newProperty(prop);
        if(cell.property instanceof AtomicProperty) {
            defaultRow.push(cell.property)
        } else {
            let id = cell.property.id;
            throw new Error(`Tabular subproperty '${ id }' is non-atomic.`);
        }
    }
    assembler.setDefaultRow(defaultRow);
    
    // Resolve values
    path = resolveLookupPath(path, prop.path);
    let value = Json.lookup(path, values);
    if(value !== undefined) {
        for(let row of value) {
            let _row: { [key: string]: any } = {};
            for(let cell of defaultRow) {
                let _path = resolveLookupPath(undefined, cell.path);
                _row[cell.id] = Json.lookup(_path, row);
            }
            prop.insertRow(prop.createRow(_row));
        }
    } else if(template.default !== undefined) {
        for(let row of template.default) {
            prop.insertRow(prop.createRow(row));
        }
    }
    
    // Install plugins
    prop.tryInstallPlugins(template.plugins ?? []);
    
    // Return assembler
    return assembler;

}

/**
 * Resolves the lookup path. 
 * @param current
 *  The current lookup path.
 * @param next
 *  The next lookup path.
 * @returns
 *  The lookup path.
 */
function resolveLookupPath(current: string | undefined, next: string): string {
    let isNextRoot;
    if(isNextRoot = next.startsWith(PageExporter.ROOT)) {
        next = next.substring(`${ PageExporter.ROOT }.`.length);
    }
    if(current === undefined || isNextRoot) {
        return next;
    } else {
        return `${ current }.${ next }`;
    }
}

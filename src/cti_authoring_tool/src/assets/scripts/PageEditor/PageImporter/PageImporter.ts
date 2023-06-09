import * as Json from "@/assets/scripts/Utilities/Json";
import * as PageExporter from "../PageExporter";
import { Plugins } from "./Templates/Plugins";
import { PluginTypeClassMap } from "./Templates/PluginTypeClassMap";
import { 
    Page, Section, EnumProperty, StringProperty, DateTimeProperty,
    FloatProperty, IntegerProperty, PageAssembler, DateProperty, TimeProperty,
    PropertyAssembler, SectionAssembler, BasicTableProperty,
    TabularPropertyAssembler, AtomicProperty, ComplexTableProperty, Plugin,
    PlugableElement, TabularProperty, Property
} from "@/assets/scripts/Page";
import {
    PageTemplate, PropertyType, SectionTemplate, PropertyTemplate,
    PluginType, AtomicPropertyTemplate
} from "./Templates";

export class PageImporter {

    /**
     * The page's assembler.
     */
    private _pageAssembler: PageAssembler;

    /**
     * The page's values.
     */
    private _values: any;

    /**
     * The page's template.
     */
    private _pageTemplate: PageTemplate;

    /**
     * The section template index.
     */
    private _sectionIndex: Map<string, SectionTemplate>;

    /**
     * The property template index.
     */
    private _propertyIndex: Map<string, PropertyTemplate>;


    /**
     * Creates a new {@link PageImporter}.
     * @param template
     *  The page's template.
     * @param values
     *  The page's values.
     */
    constructor(template: PageTemplate);

    /**
     * Creates a new {@link PageImporter}.
     * @param template
     *  The page's template.
     * @param values
     *  The page's values.
     */
    constructor(template: PageTemplate, values?: any);
    constructor(template: PageTemplate, values?: any) {
        this._values = values ?? {};
        this._pageTemplate = template;
        this._sectionIndex = new Map();
        this._propertyIndex = new Map();
        this._pageAssembler = this.createPage(template);
    }

    
    ///////////////////////////////////////////////////////////////////////////////
    //  1. Page Construction  /////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////


    /**
     * Creates a new {@link PageAssembler} from a {@link PageTemplate}.
     * and registers the template.
     * @param template
     *  The page's template.
     * @returns
     *  The page's assembler.
     */
    private createPage(template: PageTemplate): PageAssembler {
        // Construct Page
        let assembler = new PageAssembler();
        new Page(template, assembler);
        // Construct Sections
        for(let s of template.sections.values()) {
            let section = this.createSection(s);
            assembler.attachSection(section);
        }
        // Register template
        this._pageTemplate = template;
        // Return page
        return assembler;
    }

    /**
     * Creates a new {@link SectionAssembler} from a {@link SectionTemplate}
     * and registers the template with the section template index.
     * @param template
     *  The section's template.
     * @returns
     *  The section's assembler.
     */
    private createSection(template: SectionTemplate): SectionAssembler {
        // Construct Section
        let assembler = new SectionAssembler();
        new Section(template, assembler);
        // Construct Properties
        for(let p of template.properties) {
            let property = this.createProperty(p);
            assembler.attachProperty(property);
        }
        // Register template
        this._sectionIndex.set(assembler.section.instance, template);
        // Return assembler
        return assembler;
    }

    /**
     * Creates a new {@link PropertyAssembler} from a {@link PropertyTemplate}
     * and registers the template with the property template index.
     * @param template
     *  The property's template.
     * @param templates
     *  The template index.
     * @returns
     *  The property's assembler.
     */
    private createProperty(template: PropertyTemplate): PropertyAssembler {
        let assembler;
        // Create property
        switch(template.type) {
            case PropertyType.String:
                assembler = new PropertyAssembler();
                let prop = new StringProperty(template, assembler);
                if(template.suggestions) {
                    prop.suggestions = template.suggestions;
                }
                break;
            case PropertyType.Float:
                assembler = new PropertyAssembler();
                new FloatProperty(template, assembler); 
                break;
            case PropertyType.Integer:
                assembler = new PropertyAssembler();
                new IntegerProperty(template, assembler); 
                break;
            case PropertyType.Date:
                assembler = new PropertyAssembler();
                new DateProperty(template, assembler);
                break;
            case PropertyType.Time:
                assembler = new PropertyAssembler();
                new TimeProperty(template, assembler);
                break;
            case PropertyType.DateTime:
                assembler = new PropertyAssembler();
                new DateTimeProperty(template, assembler);
                break;
            case PropertyType.Enum:
                assembler = new PropertyAssembler();
                new EnumProperty(template, assembler);
                break;
            case PropertyType.BasicTable:
                assembler = new TabularPropertyAssembler();
                new BasicTableProperty(template, assembler);
                // Configure default row
                assembler.setDefaultRow(
                    this.createTabularPropertyDefaultRow(template.properties)
                );
                break;
            case PropertyType.ComplexTable:
                assembler = new TabularPropertyAssembler();
                new ComplexTableProperty(template, assembler);
                // Configure default row
                assembler.setDefaultRow(
                    this.createTabularPropertyDefaultRow(template.properties)
                );
                break;
        }
        // Register template
        this._propertyIndex.set(assembler.property.instance, template);
        // Return assembler
        return assembler;
    }

    /**
     * Creates a {@link TabularProperty}'s default row.
     * @param templates
     *  A list of templates which define the property's default row.
     * @returns
     *  The default row.
     */
    private createTabularPropertyDefaultRow(templates: AtomicPropertyTemplate[]): AtomicProperty[] {
        let defaultRow: AtomicProperty[] = [];
        for(let prop of templates) {
            let cell = this.createProperty(prop);
            if(cell.property instanceof AtomicProperty) {
                defaultRow.push(cell.property)
            } else {
                let id = cell.property.id;
                throw new Error(`Tabular subproperty '${ id }' is non-atomic.`);
            }
        }
        return defaultRow;
    }

    
    ///////////////////////////////////////////////////////////////////////////////
    //  2. Page Initialization  ///////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////


    /**
     * Initializes the page.
     * @param enablePlugins
     *  True if plugins should be enabled, false otherwise.
     *  (Default: true)
     * @returns
     *  The page importer.
     */
    public initialize(enablePlugins: boolean = true): PageImporter {
        // Initialize plugins
        if(enablePlugins) {
            this.initializePlugins(this._pageAssembler.page);
        }
        // Initialize values
        this.initializeValues(this._pageAssembler.page);
        return this;
    }


    ///////////////////////////////////////////////////////////////////////////////
    //  3. Plugin Initialization  /////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////


    /**
     * Initializes the plugins of a page element and its descendants.
     * @param element
     *  The element.
     */
    private initializePlugins(element: Page | Section | Property): void {
        
        // If page
        if(element instanceof Page) {
            // Install plugins
            let plugins = this._pageTemplate.plugins;
            if(plugins) {
                this.installElementPlugins(element, plugins);
            }
            // Traverse
            for(let section of element.sections.values()) {
                this.initializePlugins(section);
            }
            return;
        }
        
        // If section
        if(element instanceof Section) {
            // Install Plugins
            let section = this._sectionIndex.get(element.instance)!;
            let plugins = section.plugins;
            if(plugins) {
                this.installElementPlugins(element, plugins);
            }
            // Traverse
            for(let property of element.properties.values()) {
                this.initializePlugins(property);
            }
            return;
        }

        // If property
        let property = this._propertyIndex.get(element.instance)!;
        let plugins = property.plugins;
        if(plugins) {
            // @ts-ignore
            this.installElementPlugins(element, plugins);
        }
        
        // If tabular property
        if(element instanceof TabularProperty) {
            // Traverse
            for(let property of element.defaultRow) {
                this.initializePlugins(property);
            }
            for(let row of element.value.values()) {
                for(let property of row) {
                    this.initializePlugins(property);
                }
            }
        }
        
    }

    /**
     * Attempts to install an element's configured plugins.
     * @param element
     *  The element.
     * @param plugins
     *  The element's plugins.
     */
    private installElementPlugins<T>(element: PlugableElement<T>, plugins: Plugins<T>) {
        // Install local plugins
        if(Array.isArray(plugins)) {
            element.tryInstallPlugins(plugins);
            return;
        }
        if(plugins.local) {
            element.tryInstallPlugins(plugins.local);
        }
        // Install global plugins
        if(!plugins.global) {
            return;
        }
        let global = plugins.global;
        for(let key in global) {
            let type = parseInt(key) as PluginType;
            if(type in PluginTypeClassMap) {
                let typeClass = PluginTypeClassMap[type];
                this.installGlobalPlugins(element, global[type]!, typeClass);
            }
        }
    }

    /**
     * Attempts to install a list of plugins across an element's descendants.
     * @param element
     *  The element.
     * @param plugins
     *  The plugins to install.
     * @param type
     *  The plugin type.
     * @param includeSelf
     *  If true, the plugins will also be installed directly on the element.
     *  (Default: false)
     */
    private installGlobalPlugins(element: PlugableElement<any>, plugins: Plugin<any>[], type: any, includeSelf: boolean = false) {
        
        // Install plugins, if applicable
        if(includeSelf) {
            if(element.constructor === type) {
                element.tryInstallPlugins(plugins);
            }
        }
        
        // If page
        if(element instanceof Page) {
            for(let section of element.sections.values()) {
                this.installGlobalPlugins(section, plugins, type, true);
            }
        }
        
        // If section
        if(element instanceof Section) {
            for(let property of element.properties.values()) {
                // @ts-ignore
                this.installGlobalPlugins(property, plugins, type, true);
            }
        }
        
        // If tabular property
        if(element instanceof TabularProperty) {
            for(let property of element.defaultRow) {
                // @ts-ignore
                this.installGlobalPlugins(property, plugins, type, true);
            }
            for(let row of element.value.values()) {
                for(let property of row) {
                    // @ts-ignore
                    this.installGlobalPlugins(property, plugins, type, true);
                }
            }
        }
        
    }


    ///////////////////////////////////////////////////////////////////////////////
    //  4. Value Initialization  //////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////


    /**
     * Initializes the values of a page element and its descendants.
     * @param element
     *  The element.
     * @param path
     *  The current search path.
     */
    private initializeValues(element: Page | Section | Property, path?: string) {
        
        // Resolve lookup path
        path = this.resolveLookupPath(path, element.path);

        // If page
        if(element instanceof Page) {
            for(let section of element.sections.values()) {
                this.initializeValues(section, path);
            }
            return;
        }
        
        // If section
        if(element instanceof Section) {
            for(let property of element.properties.values()) {
                this.initializeValues(property, path);
            }
            return;
        }

        // If property
        let value = Json.lookup(path, this._values);
        let property = this._propertyIndex.get(element.instance)!; 
        
        // If tabular property
        if(element instanceof TabularProperty) {
            
            // Initialize default row
            for(let property of element.defaultRow) {
                this.initializeValues(property, path);
            }
            
            // Initialize rows
            if(value !== undefined) {
                let newRow: { [key: string]: string };
                for(let row of value) {
                    newRow = {};
                    for(let cell of element.defaultRow) {
                        let cellPath = this.resolveLookupPath(undefined, cell.path);
                        newRow[cell.id] = Json.lookup(cellPath, row);
                    }
                    element.insertRow(element.createRow(newRow));
                }
            } else if(property.default !== undefined) {
                // @ts-ignore
                for(let row of property.default) {
                    element.insertRow(element.createRow(row));
                }
            }
            
            return;
            
        }
        
        // If atomic property
        if(element instanceof AtomicProperty) {
            if(value !== undefined) {
                element.value = value;
            } else if(property.default !== undefined) {
                // @ts-ignore
                element.value = property.default;
            }
        }

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
    private resolveLookupPath(current: string | undefined, next: string): string {
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


    ///////////////////////////////////////////////////////////////////////////////
    //  5. Page Return  ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////


    /**
     * Returns the importer's page.
     * @returns
     *  The importer's page.
     */
    public getPage(): Page {
        return this._pageAssembler.page;
    }

}

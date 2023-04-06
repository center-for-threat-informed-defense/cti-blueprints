import { IPageSection } from "./Page/IPagesSection";
import { 
    IBasicTableProperty, 
    IComplexTableProperty, 
    IDateTimeProperty,
    IEnumProperty,
    INumberProperty,
    IStringProperty
} from "./Page/Property";


///////////////////////////////////////////////////////////////////////////////
//  1. Property Templates  ////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/**
 * Property Types
 */
export enum PropertyType {
    String, Integer, Float, Time, Date, DateTime, Enum, BasicTable, ComplexTable
}

/**
 * Alignment Types
 */
export enum Alignment { 

    /**
     * Top left alignment
     * 
     * @example
     * 
     * | X . . |
     * | . . . |
     * | . . . |
     * 
     */
    TopLeft,
    
    /**
     * Top center alignment
     * 
     * @example
     * 
     * | . X . |
     * | . . . |
     * | . . . |
     * 
     */
    TopCenter, 
    
    /**
     * Top right alignment
     * 
     * @example
     * 
     * | . . X |
     * | . . . |
     * | . . . |
     * 
     */
    TopRight,

    /**
     * Middle left alignment
     * 
     * @example
     * 
     * | . . . |
     * | X . . |
     * | . . . |
     * 
     */
    MiddleLeft,
    
    /**
     * Middle center alignment
     * 
     * @example
     * 
     * | . . . |
     * | . X . |
     * | . . . |
     * 
     */
    MiddleCenter, 
    
    /**
     * Middle right alignment
     * 
     * @example
     * 
     * | . . . |
     * | . . X |
     * | . . . |
     * 
     */
    MiddleRight,

    /**
     * Bottom left alignment
     * 
     * @example
     * 
     * | . . . |
     * | . . . |
     * | X . . |
     * 
     */
    BottomLeft, 
    
    /**
     * Bottom center alignment
     * 
     * @example
     * 
     * | . . . |
     * | . . . |
     * | . X . |
     * 
     */
    BottomCenter, 
    
    /**
     * Bottom right alignment
     * 
     * @example
     * 
     * | . . . |
     * | . . . |
     * | . . X |
     * 
     */
    BottomRight

}

/**
 * Plugin
 */
export interface Plugin<T> {
    plugin: new (property: T, options?: any) => any;
    options?: () => any;
}

/**
 * Property Template
 */
export interface PropertyTemplate {
    id?: string
    name: string;
    type: PropertyType;
    row: number | [number, number];
    col: number | [number, number];
    is_primary?: boolean;
    plugins?: Plugin<any>[],
}

/**
 * Atomic Property Template
 */
export interface AtomicPropertyTemplate extends PropertyTemplate {
    required?: boolean;
    alignment?: Alignment;
}

/**
 * String Property Template
 */
export interface StringPropertyTemplate extends AtomicPropertyTemplate {
    type: PropertyType.String;
    default?: null | string;
    plugins?: Plugin<IStringProperty>[],
    suggestions?: string[];
}

/**
 * Number Property Template
 */
export interface NumberPropertyTemplate extends AtomicPropertyTemplate {
    type: PropertyType.Integer | PropertyType.Float;
    min?: number;
    max?: number;
    default?: null | number;
    plugins?: Plugin<INumberProperty>[],
}

/**
 * Date Time Property Template
 */
export interface DateTimePropertyTemplate extends AtomicPropertyTemplate {
    type: PropertyType.Date | PropertyType.Time | PropertyType.DateTime;
    default?: null | string | Date;
    plugins?: Plugin<IDateTimeProperty>[],
}

/**
 * Enum Property Template
 */
export interface EnumPropertyTemplate extends AtomicPropertyTemplate {
    type: PropertyType.Enum;
    options: { id: string, text: string, value: any }[];
    default?: null | string;
    plugins?: Plugin<IEnumProperty>[],
}

/**
 * Tabular Property Template
 */
export interface TabularPropertyTemplate extends PropertyTemplate {
    type: PropertyType.BasicTable | PropertyType.ComplexTable;
    default?: TabularPropertyRowValue[];
    layout: {
        rows?: number,
        cols: number
    }
    properties: AtomicPagePropertyTemplate[];
}

/**
 * Tabular Property Row Value
 */
export type TabularPropertyRowValue = { 
    [key: string]: null | number | string | Date 
};


/**
 * Basic Table Property Template
 */
export interface BasicTablePropertyTemplate extends TabularPropertyTemplate {
    type: PropertyType.BasicTable;
    layout: {
        cols: number;
    },
    plugins?: Plugin<IBasicTableProperty>[]
}

/**
 * Complex Table Property Template
 */
export interface ComplexTablePropertyTemplate extends TabularPropertyTemplate {
    type: PropertyType.ComplexTable;
    layout: {
        summary: string,
        rows: number,
        cols: number
    }
    plugins?: Plugin<IComplexTableProperty>[]
}

/**
 * Atomic Page Property Template
 */
export type AtomicPagePropertyTemplate
    = StringPropertyTemplate
    | NumberPropertyTemplate
    | DateTimePropertyTemplate
    | EnumPropertyTemplate

/**
 * Page Property Template
 */
export type PagePropertyTemplate
    = AtomicPagePropertyTemplate
    | BasicTablePropertyTemplate
    | ComplexTablePropertyTemplate


///////////////////////////////////////////////////////////////////////////////
//  2. Page Templates  ////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/**
 * App Page Section Template
 */
export interface PageSectionTemplate {
    id?: string;
    name: string;
    layout: {
        rows: number;
        cols: number;
    }
    properties: PagePropertyTemplate[];
    is_primary?: boolean;
    plugins?: Plugin<IPageSection>[]
}

/**
 * App Page Template
 */
export interface PageTemplate {
    id: string,
    name: string,
    sections: PageSectionTemplate[]
}


///////////////////////////////////////////////////////////////////////////////
//  3. App Configuration  /////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/**
 * App Configuration File
 */
export interface AppConfiguration {
    is_web_hosted: boolean,
    file_type_name: string,
    file_type_extension: string,
    templates: PageTemplate[]
    menus: {
        help_menu: {
            help_links: { text: string, url: string }[]
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
//  1. Property Templates  ////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/**
 * Property Types
 */
export enum PropertyType {
    String, Integer, Float, Date, Enum, Table
}

/**
 * Alignment Types
 */
export enum Alignment { 
    TL, TC, TR,
    ML, MC, MR,
    BL, BC, BR
}

export enum Sort {
    Descending, None, Ascending
}

/**
 * Property Template
 */
export interface PropertyTemplate {
    id: string;
    name: string;
    type: PropertyType;
    row: number | [number, number];
    col: number | [number, number];
    is_primary?: boolean
}

/**
 * Atomic Property Template
 */
export interface AtomicPropertyTemplate extends PropertyTemplate {
    sort?: Sort,
    grow?: boolean;
    required?: boolean;
    alignment?: Alignment;
}

/**
 * String Property Template
 */
export interface StringPropertyTemplate extends AtomicPropertyTemplate {
    type: PropertyType.String;
    default?: null | string;
}

/**
 * Number Property Template
 */
export interface NumberPropertyTemplate extends AtomicPropertyTemplate {
    type: PropertyType.Integer | PropertyType.Float;
    default?: null | number;
}

/**
 * Date Property Template
 */
export interface DatePropertyTemplate extends AtomicPropertyTemplate {
    type: PropertyType.Date;
    default?: null | string | Date;
}

/**
 * Enum Property Template
 */
export interface EnumPropertyTemplate extends AtomicPropertyTemplate {
    type: PropertyType.Enum;
    default?: null | number;
    options: [any, string];
}

/**
 * Table Property Template
 */
export interface TablePropertyTemplate extends PropertyTemplate {
    type: PropertyType.Table;
    default?: { [key: string]: null | number | string | Date }[];
    table_columns: {
        number: number,
        properties: PageAtomicPropertyTemplate[]
    }
}

/**
 * Page Atomic Property Template
 */
export type PageAtomicPropertyTemplate
    = StringPropertyTemplate
    | NumberPropertyTemplate
    | DatePropertyTemplate
    | EnumPropertyTemplate

/**
 * Page Property Template
 */
export type PagePropertyTemplate
    = PageAtomicPropertyTemplate
    | TablePropertyTemplate


///////////////////////////////////////////////////////////////////////////////
//  2. Page Templates  ////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/**
 * App Page Section Template
 */
export type PageSectionTemplate = {
    id: string,
    name: string,
    rows: number,
    cols: number,
    properties: PagePropertyTemplate[],
    is_primary?: boolean
}

/**
 * App Page Template
 */
export type PageTemplate = {
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
export type AppConfiguration = {
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

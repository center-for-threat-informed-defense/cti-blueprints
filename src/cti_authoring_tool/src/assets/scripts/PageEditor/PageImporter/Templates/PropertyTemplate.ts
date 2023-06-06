import { PropertyType } from "./PropertyType";
import {
    PropertyParameters,
    AtomicPropertyParameters,
    NumberPropertyParameters,
    EnumPropertyParameters,
    StringProperty,
    NumberProperty,
    DateTimeProperty,
    EnumProperty,
    Plugin,
    ComplexTablePropertyParameters,
    BasicTablePropertyParameters,
    TabularProperty
} from "@/assets/scripts/Page";


/**
 * String Property Template
 */
export interface StringPropertyTemplate extends AtomicPropertyParameters {
    type          : PropertyType.String;
    default?      : null | string;
    suggestions?  : string[];
    plugins?      : Plugin<StringProperty>[],
}


/**
 * Number Property Template
 */
export interface NumberPropertyTemplate extends NumberPropertyParameters {
    type          : PropertyType.Integer | PropertyType.Float;
    default?      : null | number;
    plugins?      : Plugin<NumberProperty>[],
}


/**
 * Date Time Property Template
 */
export interface DateTimePropertyTemplate extends AtomicPropertyParameters {
    type          : PropertyType.Date | PropertyType.Time | PropertyType.DateTime;
    default?      : string | Date | null;
    plugins?      : Plugin<DateTimeProperty>[],
}


/**
 * Enum Property Template
 */
export interface EnumPropertyTemplate extends EnumPropertyParameters {
    type          : PropertyType.Enum;
    default?      : string | null;
    plugins?      : Plugin<EnumProperty>[],
}


/**
 * Tabular Property Row Value
 */
export type TabularPropertyRowValue = { 
    [key: string] : null | number | string | Date 
};


/**
 * Basic Table Property Template
 */
export interface BasicTablePropertyTemplate extends BasicTablePropertyParameters {
    type          : PropertyType.BasicTable;
    default?      : TabularPropertyRowValue[];
    properties    : AtomicPropertyTemplate[];
    plugins?      : Plugin<TabularProperty>[]
}


/**
 * Complex Table Property Template
 */
export interface ComplexTablePropertyTemplate extends ComplexTablePropertyParameters {
    type          : PropertyType.ComplexTable;
    default?      : TabularPropertyRowValue[];
    properties    : AtomicPropertyTemplate[];
    plugins?      : Plugin<TabularProperty>[]
}


/**
 * Atomic Property Template
 */
export type AtomicPropertyTemplate
    = StringPropertyTemplate
    | NumberPropertyTemplate
    | DateTimePropertyTemplate
    | EnumPropertyTemplate

/**
 * Property Template
 */
export type PropertyTemplate
    = AtomicPropertyTemplate
    | BasicTablePropertyTemplate
    | ComplexTablePropertyTemplate

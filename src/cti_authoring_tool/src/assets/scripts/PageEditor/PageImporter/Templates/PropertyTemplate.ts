import { Plugins } from "./Plugins";
import { PropertyType } from "./PropertyType";
import {
    AtomicPropertyParameters,
    EnumPropertyParameters,
    StringProperty,
    DateTimeProperty,
    EnumProperty,
    ComplexTablePropertyParameters,
    BasicTablePropertyParameters,
    IntegerProperty,
    FloatProperty,
    NumberPropertyParameters,
    BasicTableProperty,
    ComplexTableProperty
} from "@/assets/scripts/Page";


/**
 * String Property Template
 */
export interface StringPropertyTemplate extends AtomicPropertyParameters {
    type          : PropertyType.String;
    default?      : null | string;
    suggestions?  : string[];
    plugins?      : Plugins<StringProperty>,
}


/**
 * Float Property Template
 */
export interface FloatPropertyTemplate extends NumberPropertyParameters {
    type          : PropertyType.Float;
    default?      : null | number;
    plugins?      : Plugins<FloatProperty>,
}


/**
 * Integer Property Template
 */
export interface IntegerPropertyTemplate extends NumberPropertyParameters {
    type          : PropertyType.Integer;
    default?      : null | number;
    plugins?      : Plugins<IntegerProperty>,
}


/**
 * Date Time Property Template
 */
export interface DateTimePropertyTemplate extends AtomicPropertyParameters {
    type          : PropertyType.Date | PropertyType.Time | PropertyType.DateTime;
    default?      : string | Date | null;
    plugins?      : Plugins<DateTimeProperty>,
}


/**
 * Enum Property Template
 */
export interface EnumPropertyTemplate extends EnumPropertyParameters {
    type          : PropertyType.Enum;
    default?      : string | null;
    plugins?      : Plugins<EnumProperty>,
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
    plugins?      : Plugins<BasicTableProperty>
}


/**
 * Complex Table Property Template
 */
export interface ComplexTablePropertyTemplate extends ComplexTablePropertyParameters {
    type          : PropertyType.ComplexTable;
    default?      : TabularPropertyRowValue[];
    properties    : AtomicPropertyTemplate[];
    plugins?      : Plugins<ComplexTableProperty>
}


/**
 * Atomic Property Template
 */
export type AtomicPropertyTemplate
    = StringPropertyTemplate
    | FloatPropertyTemplate
    | IntegerPropertyTemplate
    | DateTimePropertyTemplate
    | EnumPropertyTemplate

/**
 * Property Template
 */
export type PropertyTemplate
    = AtomicPropertyTemplate
    | BasicTablePropertyTemplate
    | ComplexTablePropertyTemplate

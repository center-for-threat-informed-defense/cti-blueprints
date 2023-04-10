/**
 * TODO:
 * Create a static class for each property type. Provide static methods that do
 * things like StringProperty.set(), StringProperty.clear(), 
 * ComplexTableProperty.collapse(), ComplexTableProperty.uncollapse() to 
 * generate PageCommands.
 * 
 * This idea should be unified with the newCommand() construct somehow.
 */

export * from "./ComplexTablePropertySetRowCollapse";
export * from "./DateTimePropertySet";
export * from "./EnumPropertySet";
export * from "./NumberPropertySet";
export * from "./StringPropertySet";
export * from "./TabularPropertyCreateRow";
export * from "./TabularPropertyDeleteRow";
export * from "./TabularPropertyMoveRow";
export * from "./TabularPropertyReorder";

import { Section } from "@/assets/scripts/Page/Section";
import { PluginType } from "./PluginType";
import { 
    BasicTableProperty, ComplexTableProperty, DateProperty, DateTimeProperty,
    EnumProperty, FloatProperty, IntegerProperty, StringProperty, TimeProperty
} from "@/assets/scripts/Page";

export const PluginTypeClassMap = {
    [PluginType.Section]              : Section,
    [PluginType.StringProperty]       : StringProperty,
    [PluginType.FloatProperty]        : FloatProperty,
    [PluginType.IntegerProperty]      : IntegerProperty,
    [PluginType.EnumProperty]         : EnumProperty,
    [PluginType.DateProperty]         : DateProperty,
    [PluginType.TimeProperty]         : TimeProperty,
    [PluginType.DateTimeProperty]     : DateTimeProperty,
    [PluginType.BasicTableProperty]   : BasicTableProperty,
    [PluginType.ComplexTableProperty] : ComplexTableProperty
}

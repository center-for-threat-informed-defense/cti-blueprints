import { AtomicNode } from "./AtomicNode";
import { ObjectMapNode } from "./ObjectMapNode";
import { ObjectArrayNode } from "./ObjectArrayNode";

/**
 * Map Node type
 */
export type MapNode = ObjectMapNode | ObjectArrayNode | AtomicNode;

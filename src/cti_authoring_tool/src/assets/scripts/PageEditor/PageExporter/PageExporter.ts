
import { AtomicNode } from "./Nodes/AtomicNode";
import { MapNode, ObjectArrayNode, ObjectMapNode } from "./Nodes";
import {
    AtomicProperty, DateTimeProperty, EnumProperty, 
    NumberProperty, Page, Property, Section, 
    StringProperty, TabularProperty
} from "@/assets/scripts/Page";


/**
 * The serializer's root token.
 */
export const ROOT: string = "*";


/**
 * Serialize's a page element.
 * @param el
 *  The {@link Page}, {@link Section}, or {@link Property} element.
 * @returns
 *  An {@link ObjectMapNode} containing the serialized data.
 */
export function serialize(el: Page | Section | Property): ObjectMapNode {
    // Create root
    let root = new ObjectMapNode();
    // Serialize
    _serialize(root, ROOT, el);
    // Return root
    return root;
}

/**
 * Serialize's a page element.
 * @param root
 *  The element's root {@link ObjectMapNode}.
 * @param path
 *  The element's absolute path.
 * @param el
 *  The {@link Page}, {@link Section}, or {@link Property} element.
 */
function _serialize(root: ObjectMapNode, path: string, el: Page | Section | Property) {
    
    // If absolute path, set new path
    if(el.path.startsWith(ROOT)) {
        path = el.path;
    }
    
    // If relative path, update path
    else {
        path = `${ path }.${ el.path }`;
    }

    // Traverse element
    if (el instanceof Page) {
        for(let sect of el.sections.values()) {
            _serialize(root, path, sect);
        }
    } else if (el instanceof Section) {
        for(let prop of el.properties.values()) {
            _serialize(root, path, prop);
        }
    } else if (el instanceof TabularProperty) {
        let array = new ObjectArrayNode();
        for(let row of el.value.values()) {
            let _root = new ObjectMapNode();
            for(let prop of row) {
                _serialize(_root, "*", prop);
            }
            array.push(_root);
        }
        _assignNodeToRoot(root, array, path);
    }

    // Set value
    else if (el instanceof AtomicProperty) {
        let value;
        if(el instanceof StringProperty) {
            value = new AtomicNode(el.value);
        } else if(el instanceof DateTimeProperty) {
            value = new AtomicNode(el.value?.toISOString() ?? null);
        } else if(el instanceof NumberProperty) {
            value = new AtomicNode(el.value);
        } else if(el instanceof EnumProperty) {
            value = new AtomicNode(el.value);
        } else {
            throw new Error(`Unexpected property type: '${ el.constructor.name }'`);
        }
        _assignNodeToRoot(root, value, path);
    }
    
}

/**
 * Assigns a {@link MapNode} to a root {@link ObjectMapNode}.
 * @param root
 *  The root {@link ObjectMapNode}.
 * @param node
 *  The {@link MapNode}.
 * @param path
 *  The {@link MapNode}'s absolute path.
 */   
function _assignNodeToRoot(root: ObjectMapNode, node: MapNode, path: string) {
    
    // Tokenize
    let tokens = path.split(/\./g);
    
    // Validate path
    if(tokens.length < 2) {
        throw new Error(`'${ path }' is invalid.`)
    }
    if(tokens.shift() !== ROOT) {
        throw new Error(`'${ path }' is not absolute.`);
    }
   
    // Resolve path
    let currentNode: MapNode = root;
    for(let i = 0; i < tokens.length - 1; i++) {
        // Step
        if(!currentNode.has(tokens[i])) {
            currentNode.set(tokens[i], new ObjectMapNode());
        }
        currentNode = currentNode.get(tokens[i])!;
        // Validate path
        if(!(currentNode instanceof ObjectMapNode)) {
            let errName = currentNode.constructor.name;
            let errPath = `${ ROOT }.${ tokens.slice(0, i + 1).join(".") }`;
            throw new Error(`'${ errPath }' (${ errName }) is not an object map.`);
        }
    }
    
    // Set value
    let key = tokens.at(-1)!;
    if(!currentNode.has(key)) {
        currentNode.set(key, node);
    } else {
        throw new Error(`'${ path }' is already assigned.`)
    }

}

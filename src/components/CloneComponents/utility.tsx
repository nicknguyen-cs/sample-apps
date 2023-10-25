import { EntryNode, AppSDK } from "../../types/cloneTypes";

export async function buildGraph(appSDK: AppSDK, entry: any, nodeMap: Map<string, EntryNode> = new Map()): Promise<EntryNode> {
    const node = new EntryNode();
        node.entry = entry;
        nodeMap.set(entry.uid, node);
        let references = getReferences(entry);
        if (references.length > 0) {
            for (const reference of references) {
                let referenceNode = nodeMap.get(reference.uid); // if reference already exists. Dont do a circle dependency.
                if (!referenceNode) {
                    let referenceData = await appSDK?.stack.ContentType(reference._content_type_uid).Entry(reference.uid).fetch();
                    referenceNode = await buildGraph(referenceData.entry, nodeMap);
                    referenceNode._content_type_uid = reference._content_type_uid;
                }
                referenceNode.visited = false;
                node.neighbors.push(referenceNode); // push duplicate references for child to parent cloning, but only clone uniques.
            }
        }
        return node;
}

export function hasCycle(node: EntryNode): boolean {
    if (node.inStack) return true;
    if (node.visited) return false;
    node.visited = true;
    node.inStack = true;

    for (const neighbor of node.neighbors) {
        if (hasCycle(neighbor)) return true;
    }

    node.inStack = false;
    return false;
}

export function getReferences(jsonField: any): any[] {
    let references: any[] = [];
    // Base case: if payload is not an object or array, return
    if (typeof jsonField !== 'object' || jsonField === null) return references;

    // If payload is an array with the expected structure
    if (Array.isArray(jsonField) && jsonField.length > 0 && jsonField[0].uid && jsonField[0]._content_type_uid) {
        for (let item of jsonField) {
            references.push(item);
        }
    } else {
        // Otherwise, recursively traverse the object
        for (let key in jsonField) {
            references = [...references, ...getReferences(jsonField[key])];
        }
    }
    return references;
}
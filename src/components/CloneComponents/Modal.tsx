import React, { useState } from "react"
import { ModalFooter, ModalBody, ModalHeader, ButtonGroup, Button, Paragraph } from "@contentstack/venus-components"
import './clone.css';
import ContentstackAppSDK from "@contentstack/app-sdk";

interface Request {
    id: number;
    status: 'loading' | 'completed';
}

interface AppSDK {
    location?: {
      SidebarWidget?: any;
    };
    getConfig?: () => Promise<any>;
    stack?: any;
  }
  

class Node {
    entry: any;
    neighbors: Node[] = []; // keep track of all children references
    visited: boolean = false; // for traversing
    inStack: boolean = false; // for cycle detection
    cloned: boolean = false; // for cloning
    _content_type_uid: any; // used for entry creation
}

interface ModalProps {
    appSDK: AppSDK | null;
    contentTypeUID: string;
    modalProps: any;
  }
  

const SelectModal : React.FC<ModalProps> = ({appSDK, contentTypeUID, modalProps}) => {

    const [loading, setLoading] = useState<boolean>(false);
    const [requests, setRequests] = useState<Request[]>([]);
    const getSidebarWidget = () => appSDK?.location?.SidebarWidget;

    let uidMapping: Map<string, string> = new Map();


    const deepClone = async () => {
        let node = await getAllReferences();
        await cloneDataInOrder(node);
    }

    async function getAllReferences() {
        let rootNode = null;
        const entryData = await fetchEntryData();
        rootNode = await buildGraph(entryData.entry);
        rootNode._content_type_uid = contentTypeUID; // because the base node needs a uid for cloning, and its not provided, like the references are
        if (hasCycle(rootNode)) {
            throw new Error("Circular dependency detected!");
        }
        return rootNode;
    }

    const fetchEntryData = async () => {
        const sidebarWidget = getSidebarWidget();
        if (!appSDK || !sidebarWidget) return null;
        const fieldData = await sidebarWidget.entry.getData();
        const contentType = await sidebarWidget.entry.content_type;
        return appSDK.stack
            .ContentType(contentType.uid)
            .Entry(fieldData.uid)
            .fetch();
    };

    /**
       * We recursively make our way to the bottom of the tree, and then start cloning from the bottom up.
       * @param node - the node to start the cloning from
       * @returns 
       */
    async function cloneDataInOrder(node: Node): Promise<string | undefined> {
        try {
            if (node.cloned) return "cloned";
            node.cloned = true;

            for (const neighbor of node.neighbors) {
                await cloneDataInOrder(neighbor);
            }
            const currentUid = node.entry.uid; // have to use this, because we remove uid for creating the entry.
            transformEntryForCloneDeep(node.entry);
            let newEntry = await appSDK?.stack.ContentType(node._content_type_uid).Entry.create({ "entry": node.entry });
            if (newEntry && newEntry.entry && newEntry.entry.uid) {
                uidMapping.set(currentUid, newEntry.entry.uid);
            } else {
                console.error("Failed to create new entry or unexpected structure:", newEntry);
            }
        } catch (error) {
            throw error;
        }
    }

    /**
   * buildGraph will recursively build a node tree from the parent entry down to all its references. With each reference it finds, it will recurse down each tree and return them up
   * in a child to parent relation. This helps us clone from the child entry to the parent, because references work in the opposite direction and we need the child UID
   * before we can make the connection.
   * @param entry - the entry object to start building the graph from
   * @param nodeMap - this keeps track of all the nodes that have been created so far. This is to avoid creating duplicate nodes for the same entry during recursion
   * @returns 
   */
    async function buildGraph(entry: any, nodeMap: Map<string, Node> = new Map()): Promise<Node> {
        const node = new Node();
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

    /**
   * We have to manipulate the UID's of references, and certain fields to make use the payload for a create entry call.
   * @param entry - the entry to transform
   */
    function transformEntryForCloneDeep(entry: any) {
        delete entry.uid;
        transformEntryForClone(entry);
        updateEntryReferenceUids(entry);
    }

    const transformEntryForClone = (entry: any) => {
        // If the object contains the "file_uid" key, replace the object with its value
        if (entry.hasOwnProperty("file_size")) {
            return entry["uid"];
        }

        // Check if the entry is an object and not null
        if (typeof entry !== 'object' || entry === null) {
            return entry;
        }

        // Otherwise, recursively transform nested objects
        for (const key in entry) {
            entry[key] = transformEntryForClone(entry[key]);
        }

        entry.title = `${entry.title} (Copy) ${Date.now()}`;
        return entry;
    };

    function updateEntryReferenceUids(entry: any) {
        // Base case: if payload is not an object or array, return
        if (typeof entry !== 'object' || entry === null) return;

        // If payload is an array with the expected structure
        if (Array.isArray(entry) && entry.length > 0 && entry[0].uid && entry[0]._content_type_uid) {
            for (let item of entry) {
                if (uidMapping.has(item.uid)) {
                    item.uid = uidMapping.get(item.uid);
                }
            }
        } else {
            // Otherwise, recursively traverse the object
            for (let key in entry) {
                updateEntryReferenceUids(entry[key]);
            }
        }
    }

    const handleRequest = () => {
        setLoading(true);
        const requestId = Date.now();

        // Add a new request with a loading status
        setRequests(prev => [...prev, { id: requestId, status: 'loading' }]);

        // Simulate API request completion after a few seconds
        setTimeout(() => {
            setRequests(prev => {
                return prev.map(request =>
                    request.id === requestId ? { ...request, status: 'completed' } : request
                );
            });
            setLoading(false);
        }, Math.random() * 2000 + 1000);  // Random time between 1-3 seconds for variety
    };

    /**
   * This just makes sure we don't have a circular dependency and crash anything. Possibly not needed.
   * @param node - the node to start the traversal from
   * @returns 
   */
    function hasCycle(node: Node): boolean {

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

    function getReferences(jsonField: any) {
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


    return (
        <>
            <ModalHeader title={"Deep Clone"} closeModal={modalProps.closeModal} />
            <ModalBody className="modalBodyCustomClass">
                <div className="api-container">
                    <button className="api-button" onClick={handleRequest} disabled={false}>
                        Initiate API Request
                    </button>
                    <ul className="request-list">
                        {requests.map(request => (
                            <li key={request.id}>
                                {request.status === 'loading' ? (
                                    <>
                                        <div className="loader"></div> Processing...
                                    </>
                                ) : (
                                    "✓ Completed"
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </ModalBody>
            <ModalFooter>
                <ButtonGroup>
                    <Button onClick={modalProps.closeModal} buttonType="light">
                        Cancel
                    </Button>
                    <Button onClick={modalProps.clone} icon="SaveWhite" >
                        Clone
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </>
    )
}

export default SelectModal;

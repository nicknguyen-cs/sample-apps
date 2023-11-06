import React, { useEffect, useState } from "react"
import { ModalFooter, ModalBody, ModalHeader, ButtonGroup, Button, Paragraph, FieldLabel, HelpText, MiniScrollableTable, TextInput, Icon, Checkbox } from "@contentstack/venus-components"
import './clone.css';
import ContentstackAppSDK from "@contentstack/app-sdk";
import { EntryNode, ModalProps } from "../../types/cloneTypes";
import { set } from "lodash";

const SelectModal: React.FC<ModalProps> = ({ appSDK, contentTypeUID, modalProps, config }) => {

    let [loading, setLoading] = useState<boolean>(false);
    let [isCloned, setIsCloned] = useState<boolean>(false);
    let [language, setLanguage] = useState<boolean>(false);
    let [miniTableData, setMiniTableData] = useState<any[]>([]);

    const getSidebarWidget = () => appSDK?.location?.SidebarWidget;

    let uidMapping: Map<string, string> = new Map();

    const deepClone = async () => {
        setLoading(true);
        setMiniTableData([]);
        let node = await buildEntryNode();
        await cloneDataInOrder(node);
        setLoading(false);
        setIsCloned(true);
    }

    async function buildEntryNode() {
        let rootNode = null;
        const entryData = await fetchEntryData();
        rootNode = await generateRootNode(entryData.entry);
        rootNode._content_type_uid = contentTypeUID; // because the base node needs a uid for cloning, and its not provided, like the references are
        if (hasCycle(rootNode)) {
            throw new Error("Circular dependency detected! Cannot clone.");
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

    async function cloneDataInOrder(node: EntryNode): Promise<string | undefined> {
        if (node.cloned) return "cloned";
        node.cloned = true;

        for (const neighbor of node.neighbors) {
            await cloneDataInOrder(neighbor);
        }

        const currentUid = node.entry.uid; // have to use this, because we remove uid for creating the entry.
        transformEntry(node.entry);
        try {

            let newEntry = await appSDK?.stack.ContentType(node._content_type_uid).Entry.create({ "entry": node.entry });
            if (newEntry && newEntry.entry && newEntry.entry.uid) {
                uidMapping.set(currentUid, newEntry.entry.uid);
                if (language) {
                    let languages = await fetchLocalesAndLanguages(currentUid, node._content_type_uid);
                    for (const locale of languages) {
                        await localizeEntryLanguage(locale, newEntry.entry.uid, currentUid, node._content_type_uid);
                    }
                }

                setMiniTableData(prevSummary => [...prevSummary, {
                    contentType: node._content_type_uid,
                    title: node.entry.title,
                    uid: node.entry.uid
                }]);
            } else {
                const errorMessage = `Failed to create new entry or unexpected structure: ${JSON.stringify(newEntry)}`;
                console.error(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = `Error creating entry for ${currentUid}: ${error.message || error}`;
            console.error(errorMessage);
            setMiniTableData(prevSummary => [...prevSummary, errorMessage]);
        }
    }

    let fetchLocalesAndLanguages = async (entryUid: string, contentTypeUid: EntryNode) => {
        const sidebarWidget = getSidebarWidget();
        if (!appSDK || !sidebarWidget) return [];

        const locales = await appSDK.stack
            .ContentType(contentTypeUid)
            .Entry(entryUid)
            .getLanguages();

        return getLocalizedLanguages(locales.locales);
    };

    const getLocalizedLanguages = (languagesArray: any) => {
        return languagesArray.filter((language: any) => language.localized).map((language: any) => language.code);
    };

    const localizeEntryLanguage = async (locale: string, newEntryUID: string, entryUid: string, contentType: string) => {
        const oldEntry = await appSDK?.stack
            .ContentType(contentType)
            .Entry(entryUid)
            .language(locale)
            .fetch();

        let entryData = transformEntryData(oldEntry.entry);
        transformEntryReferenceUids(entryData);
        let payload = {
            entry: entryData
        }
        appSDK?.stack.ContentType(contentType).Entry(newEntryUID).update(payload, locale)
    };

    /**
   * buildGraph will recursively build a node tree from the parent entry down to all its references. With each reference it finds, it will recurse down each tree and return them up
   * in a child to parent relation. This helps us clone from the child entry to the parent, because references work in the opposite direction and we need the child UID
   * before we can make the connection.
   * @param entry - the entry object to start building the graph from
   * @param nodeMap - this keeps track of all the nodes that have been created so far. This is to avoid creating duplicate nodes for the same entry during recursion
   * @returns 
   */
    async function generateRootNode(entry: any, nodeMap: Map<string, EntryNode> = new Map()): Promise<EntryNode> {
        const node = new EntryNode();
        node.entry = entry;
        nodeMap.set(entry.uid, node);
        let references = getReferences(entry);
        if (references.length > 0) {
            for (const reference of references) {
                let referenceNode = nodeMap.get(reference.uid); // if reference already exists. Dont do a circle dependency.
                if (!referenceNode) {
                    let referenceData = await appSDK?.stack.ContentType(reference._content_type_uid).Entry(reference.uid).fetch();
                    referenceNode = await generateRootNode(referenceData.entry, nodeMap);
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
    function transformEntry(entry: any) {
        delete entry.uid;
        transformEntryData(entry);
        transformEntryReferenceUids(entry);
    }

    const transformEntryData = (entry: any) => {
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
            entry[key] = transformEntryData(entry[key]);
        }

        entry.title = `[Cloned] - ${entry.title} ${Date.now()}`;
        return entry;
    };

    function transformEntryReferenceUids(entry: any) {
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
                transformEntryReferenceUids(entry[key]);
            }
        }
    }

    /**
   * This just makes sure we don't have a circular dependency and crash anything. Possibly not needed.
   * @param node - the node to start the traversal from
   * @returns 
   */
    function hasCycle(node: EntryNode): boolean {

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
            <ModalHeader title={"Entry Cloning"} closeModal={modalProps.closeModal} />
            <ModalBody>
                <h2 style={{ paddingBottom: 10}}> Settings </h2>
                <Checkbox
                    checked={language}
                    label="All Languages"
                    onClick={() => { setLanguage(!language) }}
                />
                <br />
                <div>
                    <>
                        <FieldLabel htmlFor="stack-permissions">
                            Cloned Items
                        </FieldLabel>
                        <MiniScrollableTable
                            headerComponent={<>
                                <div className="flex-v-center">
                                    <FieldLabel htmlFor="ContentType">
                                        Success
                                    </FieldLabel>
                                </div>
                                <div className="flex-v-center" style={{ marginLeft: 20 }}>
                                    <FieldLabel htmlFor="ContentType">
                                        Content Type
                                    </FieldLabel>
                                </div>
                                <div style={{ marginLeft: 20 }}>
                                    <FieldLabel htmlFor="Title" >
                                        Title
                                    </FieldLabel>
                                </div>
                            </>}
                            maxContentHeight="250px"
                            rowComponent={miniTableData.map((item, index) => (
                                <div key={index} className="flex-v-center mb-20">
                                    <div key={index} className="flex-v-center mb-20">
                                        <div style={{ "width": "90px" }}>
                                            <Icon icon='SuccessInverted' width="small" />
                                        </div>
                                        <TextInput value={item.contentType} width="small" disabled />
                                        <TextInput value={item.title} width="x-large" disabled />
                                    </div>
                                </div>
                            ))}
                            testId="cs-mini-scrollable-table"
                            type="Primary"
                            width="auto"
                        />
                        <Button icon="PublishWhite" onClick={deepClone} isLoading={loading} disabled={isCloned}>
                            Start Clone
                        </Button>
                    </>
                </div>
            </ModalBody>
            <ModalFooter>
                <ButtonGroup>
                    <Button onClick={modalProps.closeModal} buttonType="light">
                        Cancel
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </>
    )
}

export default SelectModal;

import { AppSDK, EntryNode, Reference } from "../../types/cloneTypes";

export async function getParentNode(sdk: AppSDK | null, contentTypeUid: string) {
    if (sdk) {
        let baseEntry = await _fetchEntryData(sdk);
        let referenceUidSet: Map<string, EntryNode> = new Map();
        let rootNode: any = await _buildParentNode(sdk, baseEntry.entry, referenceUidSet);
        rootNode.contentTypeUid = contentTypeUid; // because the base node needs a uid for cloning, and its not provided, like the references are
        if (_hasCycle(rootNode)) {
            throw new Error("Circular dependency detected! Cannot clone.");
        }
        return rootNode;
    }
    return null;
}

export async function cloneEntry(sdk: AppSDK | null, node: EntryNode, isCloningLocales: boolean, referenceUidMapping: Map<string, EntryNode>, processMiniTableData: (languages: string[], node: EntryNode) => void) {
    if (node.cloned) return "cloned";
    node.cloned = true;

    for (const neighborNode of node.neighbors) {
        await cloneEntry(sdk, neighborNode, isCloningLocales, referenceUidMapping, processMiniTableData);
    }

    const currentUid = node.entry.uid; // have to use this, because we remove uid for creating the entry.
    _transformEntry(node.entry, referenceUidMapping);
    console.log(node)
    try {
        if (!referenceUidMapping.has(currentUid)) {
            let newEntry = await sdk?.stack.ContentType(node.contentTypeUid).Entry.create({ "entryasdasdasd": node.entry });
            if (newEntry && newEntry.entry && newEntry.entry.uid) {
                referenceUidMapping.set(currentUid, newEntry.entry.uid);
                if (isCloningLocales) {
                    _cloneEntryLocales(sdk, currentUid, node, newEntry, referenceUidMapping, processMiniTableData);
                } else {
                    processMiniTableData(["en-us"], node);
                }
            }
        }
    } catch (error: any) {
        if (error) {
            throw new Error(`Error creating entry for ${currentUid}: There is an error with the API layer that is causing cloning to fail.`);
        } else {
            // For unknown error types, rethrow with a standard error message
            throw new Error('An unexpected error occurred');
        }
    }
}

async function _fetchEntryData(sdk: AppSDK) {
    const sidebarWidget = sdk?.location?.SidebarWidget
    if (!sdk || !sidebarWidget) return null;
    const fieldData = await sidebarWidget.entry.getData();
    const contentType = await sidebarWidget.entry.content_type;
    return sdk.stack
        .ContentType(contentType.uid)
        .Entry(fieldData.uid)
        .fetch();
}

function _hasCycle(node: EntryNode): boolean {
    if (node.inStack) return true;
    if (node.visited) return false;
    node.visited = true;
    node.inStack = true;

    for (const neighbor of node.neighbors) {
        if (_hasCycle(neighbor)) return true;
    }

    node.inStack = false;
    return false;
}

async function _buildParentNode(sdk: AppSDK, entry: any, nodeMap: Map<string, EntryNode>): Promise<EntryNode> {
    const node = _createNode(entry);
    await _addReferencesToNode(node, entry, sdk, nodeMap);
    return node;
}

function _createNode(entry: any): EntryNode {
    const node = new EntryNode();
    node.entry = entry;
    node.neighbors = [];
    return node;
}

async function _addReferencesToNode(node: EntryNode, entry: any, sdk: AppSDK, nodeMap: Map<string, EntryNode>) {
    let references = _getAllReferences(entry);
    for (const reference of references) {
        let referenceNode = nodeMap.get(reference.uid);
        if (!referenceNode) {
            referenceNode = await _fetchAndBuildNode(sdk, reference, nodeMap);
        }
        node.neighbors.push(referenceNode);
    }
}

async function _fetchAndBuildNode(sdk: AppSDK, reference: any, nodeMap: Map<string, EntryNode>): Promise<EntryNode> {
    let referenceData = await sdk?.stack.ContentType(reference._content_type_uid).Entry(reference.uid).fetch();
    let referenceNode = await _buildParentNode(sdk, referenceData.entry, nodeMap);
    referenceNode.contentTypeUid = reference._content_type_uid;
    referenceNode.visited = false;
    return referenceNode;
}

function _getAllReferences(entry: any) {
    let references: Reference[] = [];
    // Base case: if payload is not an object or array, return
    if (typeof entry !== 'object' || entry === null) return references;

    // If payload is an array with the expected structure
    if (Array.isArray(entry) && entry.length > 0 && entry[0].uid && entry[0]._content_type_uid) {
        for (let item of entry) {
            references.push(item);
        }
    } else {
        // Otherwise, recursively traverse the object
        for (let key in entry) {
            references = [...references, ..._getAllReferences(entry[key])];
        }
    }
    return references;
}

async function _cloneEntryLocales(sdk: AppSDK | null, currentUid: string, node: EntryNode, newEntry: any, referenceUidMapping: Map<string, EntryNode>, processMiniTableData: (languages: string[], node: EntryNode) => void) {
    let masterLocale = await sdk?.stack.getData()
    let languages: string[] = [];
    languages = await _fetchLocalesAndLanguages(sdk, currentUid, node.contentTypeUid);
    languages.push(masterLocale.master_locale);
    for (const locale of languages) {
        _localizeEntryLanguage(sdk, locale, newEntry.entry.uid, currentUid, node.contentTypeUid, referenceUidMapping);
    }
    processMiniTableData(languages, node);
}

function _transformEntry(entry: any, referenceUidMapping: Map<string, EntryNode>) {
    delete entry.uid;
    _transformEntryData(entry);
    _transformEntryReferenceUids(entry, referenceUidMapping);
}

function _transformEntryData(entry: any) {
    // Check if the entry is an object and not null
    if (typeof entry !== 'object' || entry === null) {
        return entry;
    }

    // If the object contains the "file_uid" key, replace the object with its value
    if (entry.hasOwnProperty("file_size")) {
        return entry["uid"];
    }

    // Otherwise, recursively transform nested objects
    for (const key in entry) {
        entry[key] = _transformEntryData(entry[key]);
    }

    entry.title = `[Cloned] - ${entry.title} ${Date.now()}`;
    return entry;
};

function _transformEntryReferenceUids(entry: any, referenceUidMapping: Map<string, EntryNode>) {
    // Base case: if payload is not an object or array, return
    if (typeof entry !== 'object' || entry === null) return;

    // If payload is an array with the expected structure
    if (Array.isArray(entry) && entry.length > 0 && entry[0].uid && entry[0]._content_type_uid) {
        for (let item of entry) {
            if (referenceUidMapping.has(item.uid)) {
                item.uid = referenceUidMapping.get(item.uid);
            }
        }
    } else {
        // Otherwise, recursively traverse the object
        for (let key in entry) {
            _transformEntryReferenceUids(entry[key], referenceUidMapping);
        }
    }
}

async function _fetchLocalesAndLanguages(sdk: AppSDK | null, entryUid: string, contentTypeUid: string): Promise<string[]> {
    if (!sdk) return [];

    const locales = await sdk.stack
        .ContentType(contentTypeUid)
        .Entry(entryUid)
        .getLanguages();

    return _getLocalizedLanguages(locales.locales);
};

function _getLocalizedLanguages(languagesArray: any): string[] {
    return languagesArray.filter((language: any) => language.localized).map((language: any) => language.code);
};

async function _localizeEntryLanguage(sdk: AppSDK | null, locale: string, newEntryUID: string, entryUid: string, contentType: string, referenceUidMapping: Map<string, EntryNode>) {
    const oldEntry = await sdk?.stack
        .ContentType(contentType)
        .Entry(entryUid)
        .language(locale)
        .fetch();

    let entryData = _transformEntryData(oldEntry.entry);
    _transformEntryReferenceUids(entryData, referenceUidMapping);
    let payload = {
        entry: entryData
    }
    sdk?.stack.ContentType(contentType).Entry(newEntryUID).update(payload, locale)
};
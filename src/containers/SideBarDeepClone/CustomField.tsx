import React, { useEffect, useState } from 'react';
import ContentstackAppSDK from '@contentstack/app-sdk';
import { Button, HelpText, Icon, ButtonGroup } from '@contentstack/venus-components';
import '@contentstack/venus-components/build/main.css';

// Interfaces for type safety and clarity
interface AppSDK {
  location?: {
    SidebarWidget?: any;
  };
  getConfig?: () => Promise<any>;
  stack?: any;
}

const EntrySidebarExtensionDeepClone: React.FC = () => {
  // State declarations
  const [apiKey, setApiKey] = useState<string>('');
  const [authorization, setAuthorization] = useState<string>('');
  const [appSDK, setAppSDK] = useState<AppSDK | null>(null);
  const [contentTypeUID, setContentTypeUID] = useState<string>('');
  const [entryUID, setEntryUID] = useState<string>('');
  const [masterLanguage, setMasterLanguage] = useState<string>('en-us');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize the app and set necessary state values
  useEffect(() => {
    const initializeApp = async () => {
      const sdk = await ContentstackAppSDK.init();
      window.postRobot = sdk.postRobot;
      setAppSDK(sdk);

      const sidebarWidget = sdk.location?.SidebarWidget;
      const fieldData = await sidebarWidget?.entry.getData();
      const contentType = await sidebarWidget?.entry.content_type;
      const installationData = await sdk.getConfig();
      setContentTypeUID(contentType.uid);
      setEntryUID(fieldData.uid);
      setApiKey(installationData.apiKey);
      setAuthorization(installationData.accessToken);
    };

    initializeApp();
  }, []);

  // Helper functions
  const getSidebarWidget = () => appSDK?.location?.SidebarWidget;

  const createRequestOptions = (method: string, body?: any): RequestInit => ({
    method,
    headers: {
      "api_key": apiKey,
      "authorization": authorization,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    redirect: 'follow'
  });

  const fetchLocalesAndLanguages = async () => {
    const sidebarWidget = getSidebarWidget();
    if (!appSDK || !sidebarWidget) return [];

    const fieldData = await sidebarWidget.entry.getData();
    const contentType = await sidebarWidget.entry.content_type;
    const locales = await appSDK.stack
      .ContentType(contentType.uid)
      .Entry(fieldData.uid)
      .includeOwner()
      .getLanguages();

    return extractLocalizedLanguages(locales.locales);
  };

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

  const shallowClone = async () => {
    if (!appSDK) return;

    setIsLoading(true);
    const languages = await fetchLocalesAndLanguages();
    const entry = await fetchEntryData();

    if (entry) {
      entry.entry = await transformEntryForClone(entry.entry);
      await createAndLocalizeClone(languages, entry);
    }
  };

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


  const createAndLocalizeClone = async (languages: string[], entry: any) => {
    setIsLoading(true);
    try {
      const newEntryUID = await createNewEntry(entry);
      if (newEntryUID) {
        for (const locale of languages) {
          await localizeEntryLanguage(locale, newEntryUID, entry.uid);
        }
        setIsValid(true);
      } else {
        setIsValid(false);
      }
    } catch (error) {
      setIsValid(false);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Can change this to the SDK, instead of a fetch request.
   * @param entry - entry for creation
   * @returns 
   */
  const createNewEntry = async (entry: any): Promise<string | null> => {
    const requestOptions = createRequestOptions('POST', entry);
    try {
      const response = await fetch(`https://api.contentstack.io/v3/content_types/${contentTypeUID}/entries?locale=${masterLanguage}`, requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const responseData = await response.json();
      return responseData.entry.uid;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  /**
   * 
   * @param locale - locale to localize content
   * @param newEntryUID - cloned entry uid that we need to localize.
   * @param entryUid - get localized content from original.
   */
  const localizeEntryLanguage = async (locale: string, newEntryUID: string, entryUid: string) => {
    const entryLocaleData = await appSDK?.stack
      .ContentType(contentTypeUID)
      .Entry(entryUid)
      .language(locale).fetch();

    entryLocaleData.entry = transformEntryForClone(entryLocaleData.entry);

    const requestOptions = createRequestOptions('PUT', entryLocaleData);
    try {
      const response = await fetch(`https://api.contentstack.io/v3/content_types/${contentTypeUID}/entries/${newEntryUID}?locale=${locale}`, requestOptions);
      console.log("Localization success:", response);
    } catch (error) {
      console.error('Localization error:', error);
    }
  };

  const extractLocalizedLanguages = (languagesArray: any) => {
    return languagesArray.filter((language: any) => language.localized).map((language: any) => language.code);
  };

  /**
   * ---------- Deep Clone ------------
   */

  class Node {
    entry: any;
    neighbors: Node[] = []; // keep track of all children references
    visited: boolean = false; // for traversing
    inStack: boolean = false; // for cycle detection
    cloned: boolean = false; // for cloning
    _content_type_uid: any; // used for entry creation
  }

  let uidMapping: Map<string, string> = new Map();

  const deepClone = async () => {
    uidMapping = new Map();
    if (!appSDK) return;
    let rootNode = null;
    const entryData = await fetchEntryData();
    rootNode = await buildGraph(entryData.entry);
    rootNode._content_type_uid = contentTypeUID; // because the base node needs a uid for cloning, and its not provided, like the references are
    if (hasCycle(rootNode)) {
      throw new Error("Circular dependency detected!");
    }
    await cloneDataInOrder(rootNode);
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
        node.neighbors.push(referenceNode);
      }
    }

    return node;
  }

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
   * We have to manipulate the UID's of references, and certain fields to make use the payload for a create entry call.
   * @param entry - the entry to transform
   */
  function transformEntryForCloneDeep(entry: any) {
    delete entry.uid;
    transformEntryForClone(entry);
    updateEntryReferenceUids(entry);
  }

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
    <div className="container type-spacing-relaxed">
      <div className="entry-sidebar-icon">
        <Icon icon="Reference" size="large" />
      </div>
      <HelpText>
        <i>
          <ol>
            <li> Deep Clone will clone all references and locales for this entry.</li>
            <li> Soft Clone will clone this entry and its localization, but not references.</li>
            <li> Reset will remove all clones created from the previous .</li>
          </ol>
        </i>
      </HelpText>
      <hr />
      <div className="row">
        <ButtonGroup>
          <Button icon="PublishWhite" onClick={deepClone}>
            Deep Clone
          </Button>
          <Button buttonType="secondary" icon="UnpublishAsset" onClick={shallowClone}>
            Shallow Clone
          </Button>
          <Button buttonType="light" onClick={() => { }}>
            Reset
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
};

export default EntrySidebarExtensionDeepClone;

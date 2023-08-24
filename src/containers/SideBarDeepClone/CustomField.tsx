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
          await localizeEntryForLanguage(locale, newEntryUID, entry.uid);
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

  const localizeEntryForLanguage = async (locale: string, newEntryUID: string, entryUid: string) => {
    const entryLocaleData = await appSDK?.stack
      .ContentType(contentTypeUID)
      .Entry(entryUID)
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
   * Have to clone references and localization
   * First get all references, then as you traverse each reference, get the localization and follow shallow clone method.
   * You have to create references first from bottom up, then work backwards linking references and previous UID's.
   * 
   * 
   * Circular depencies will be an issue, so you have to keep track of UID's and references. 
   * Example: What if there is A -> B -> C -> D -> E, and then there is also B -> E.
   * 
   * It would be easier to collect all references and sort them by depth, then clone them in order.
   * We would have to keep track of the reference to reference, and if already created then associate it with it. 
   */

  class Node {
    data: any;
    neighbors: Node[] = [];
    visited: boolean = false;
    inStack: boolean = false; // for cycle detection
  }

  let uidMapping: Map<string, string> = new Map();

  const deepClone = async () => {
    if (!appSDK) return;

    const entryData = await fetchEntryData();

    const rootNode = await buildGraph(entryData.entry);
    if (hasCycle(rootNode)) {
      // Handle circular dependency
      // For now, we'll just throw an error
      throw new Error("Circular dependency detected!");
    }
    await cloneDataInOrder(rootNode);
  }

  async function buildGraph(data: any, nodeMap: Map<string, Node> = new Map()): Promise<Node> {
    const node = new Node();
    node.data = data;
    nodeMap.set(data.uid, node);

    if (data.reference) {
      for (const ref of data.reference) {
        let refNode = nodeMap.get(ref.uid);
        if (!refNode) {
          const refData = await appSDK?.stack.ContentType(ref._content_type_uid).Entry(ref.uid).fetch();
          refNode = await buildGraph(refData, nodeMap);
        }
        node.neighbors.push(refNode);
      }
    }

    // Handle other potential reference points similarly (e.g., modular_blocks)

    return node;
  }

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

  async function cloneDataInOrder(node: Node): Promise<void> {
    try {
      console.log("Visiting node: " , node);

    if (node.visited) return;

    node.visited = true;

    // First clone neighbors (dependencies)
    for (const neighbor of node.neighbors) {
      await cloneDataInOrder(neighbor);
    }

    console.log("Cloning node:", node);
  } catch (error) {
    throw error;
  }

    

    // Clone current node and store mapping
    //const clonedData = await appSDK?.stack.ContentType(node.data.entry._content_type_uid).entry().create(node.data.entry);
    //uidMapping.set(node.data.entry.uid, clonedData.entry.uid);
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

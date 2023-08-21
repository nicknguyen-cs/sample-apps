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

  const cloneEntry = async () => {
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

  const localizeEntryForLanguage = async (locale: string, newEntryUID: string, entryUid : string) => {
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
    console.log("Languages array:", languagesArray);
    return languagesArray.filter((language: any) => language.localized).map((language: any) => language.code);
  };

  return (
    <div className="container type-spacing-relaxed">
      <div className="entry-sidebar-icon">
        <Icon icon="Reference" size="large" />
      </div>
      <HelpText>
        <i>
          <ol>
            <li> Deep Clone will clone all references and locales for this entry.</li>
            <li> Soft Clone will clone all references.</li>
            <li> Reset will remove all clones created from the previous .</li>
          </ol>
        </i>
      </HelpText>
      <hr />
      <div className="row">
        <ButtonGroup>
          <Button icon="PublishWhite" onClick={cloneEntry}>
            Deep Clone
          </Button>
          <Button buttonType="secondary" icon="UnpublishAsset" onClick={() => { }}>
            Soft Clone
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

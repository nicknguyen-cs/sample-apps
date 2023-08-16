import React, { useEffect, useRef, useState } from 'react';
import ContentstackAppSDK from '@contentstack/app-sdk';
import { AsyncLoader, Button } from '@contentstack/venus-components';
import '@contentstack/venus-components/build/main.css';
import { set } from 'lodash';

interface AppSDK {
  location?: {
    SidebarWidget?: any;
  };
  getConfig?: () => Promise<any>;
  stack?: any;
}

const EntrySidebarExtensionDeepClone = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [authorization, setAuthorization] = useState<string>('');
  const [appSDK, setAppSDK] = useState<AppSDK | null>(null);
  const [contentTypeUID, setContentTypeUID] = useState<string>('');
  const [entryUID, setEntryUID] = useState<string>('');
  const [masterLanguage, setMasterLanguage] = useState<string>('');
  const [validation, setValidation] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const ref = useRef(null);

  useEffect(() => {
    const initializeApp = async () => {
      const sdk = await ContentstackAppSDK.init();
      window.postRobot = sdk.postRobot;
      setAppSDK(sdk);
      const sidebarWidget = sdk.location?.SidebarWidget;
      const fieldData = await sidebarWidget?.entry.getData();
      const contenttype = await sidebarWidget?.entry.content_type;
      var installationData = await sdk.getConfig();
      console.log("install data: " , installationData);
      setContentTypeUID(contenttype.uid);
      setEntryUID(fieldData.uid);
      setMasterLanguage("en-us");
      setApiKey(installationData.apiKey);
      setAuthorization(installationData.accessToken);
    };
    initializeApp();
  }, []);

  const getSidebarWidget = () => appSDK?.location?.SidebarWidget;


  const fetchLocalesAndLanguages = async () => {
    const sidebarWidget = getSidebarWidget();
    if (!appSDK || !sidebarWidget) return [];

    const fieldData = await sidebarWidget.entry.getData();
    const contenttype = await sidebarWidget.entry.content_type;
    const locales = await appSDK.stack
      .ContentType(contenttype.uid)
      .Entry(fieldData.uid)
      .includeOwner()
      .getLanguages();

    return getLanguages(locales.locales);
  };

  const fetchEntry = async () => {
    const sidebarWidget = getSidebarWidget();
    if (!appSDK || !sidebarWidget) return null;

    const fieldData = await sidebarWidget.entry.getData();
    const contenttype = await sidebarWidget.entry.content_type;
    return appSDK.stack
      .ContentType(contenttype.uid)
      .Entry(fieldData.uid)
      .fetch();
  };

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

  const cloneEntry = async () => {
    if (!appSDK) {
      return;
    }
    setLoading(true);
    const languages = await fetchLocalesAndLanguages();
    const entry = await fetchEntry();
    if (entry) {
      entry.entry = await transformEntry(entry.entry);
      createDeepClone(languages, entry);
    }
  };

  const createDeepClone = async (languages: any[], entry: any) => {
    if (!appSDK && !entryUID && !contentTypeUID) {
      return;
    }
    const requestOptions = createRequestOptions('POST', entry);
    try {
      const response = await fetch(`https://api.contentstack.io/v3/content_types/blog_post/entries?locale=${masterLanguage}`, requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const responseData = await response.json();
      for (const locale of languages) {
        const newEntryUID = responseData.entry.uid;
        const entryLocaleData = await appSDK?.stack
          .ContentType(contentTypeUID)
          .Entry(entryUID)
          .language(locale).fetch();
        entryLocaleData.entry = await transformEntry(entryLocaleData.entry);
        localizeLanguages(locale, entryLocaleData, newEntryUID);
      }
      setValidation(true);
    } catch (error) {
      setValidation(false);
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  }

  const transformEntry = async (entry: any) => {
    for (const key in entry) {
      if (Object.prototype.hasOwnProperty.call(entry, key)) {
        const value = entry[key];
        if (typeof value === 'object' && value !== null) {
          for (const subKey in value) {
            if (Object.prototype.hasOwnProperty.call(value, subKey)) {
              if (subKey === "file_size") {
                entry[key] = value.uid;
              }
            }
          }
        }
      }
    }
    entry.title = `${entry.title} - Deep Copy`;
    return entry;
  }

  const localizeLanguages = async (locale: string, entry: any, newEntryUID: string) => {
    const requestOptions = createRequestOptions('PUT', entry);
    try {
      const response = await fetch(`https://api.contentstack.io/v3/content_types/blog_post/entries/${newEntryUID}?locale=${locale}`, requestOptions);
      console.log("success", response);
    } catch (error) {
      console.log('error', error);
    }
  }

  const getLanguages = async (languagesArray: any) => {
    const localizedArray: any[] = [];
    for (const language of languagesArray) {
      if (language.localized) {
        localizedArray.push(language.code);
      }
    }
    return localizedArray;
  };

  const RenderButton = ({ label, action }: { label: string, action: () => void }) => (
    <div className="entry-sidebar-container">
      {loading ? (
        <AsyncLoader color="#6C5CE7" />
      ) : (
        <Button id={label.toLowerCase().replace(' ', '-')} buttonType="outline" onClick={action}>
          {label}
        </Button>
      )}
    </div>
  );

  return (
    <div ref={ref} className="extension-wrapper">
      <div className="entry-sidebar">
        <RenderButton label="Deep Clone" action={cloneEntry} />
        <RenderButton label="Hard Reset" action={cloneEntry} /> {/* Replace with the correct action */}
        <RenderButton label="Soft Reset" action={cloneEntry} /> {/* Replace with the correct action */}
      </div>
    </div>
  );
};

export default EntrySidebarExtensionDeepClone;


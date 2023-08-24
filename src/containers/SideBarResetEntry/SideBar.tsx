import React, { useEffect, useState } from 'react';
import ContentstackAppSDK from '@contentstack/app-sdk';
import { Button, HelpText, Icon, ButtonGroup } from '@contentstack/venus-components';
import '@contentstack/venus-components/build/main.css';
import NotificationComponent from './NotificationComponent';
// Interfaces for type safety and clarity

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
interface JsonArray extends Array<JsonValue> { }

interface AppSDK {
  location?: {
    SidebarWidget?: any;
  };
  getConfig?: () => Promise<any>;
  stack?: any;
}

const EntrySidebarExtensionResetEntry: React.FC = () => {
  // State declarations
  const [appSdk, setAppSdk] = useState<AppSDK | null>(null);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Initialize the app SDK on component mount
  useEffect(() => {
    ContentstackAppSDK.init().then((appSdk) => {
      setAppSdk(appSdk);
    });
  }, []);

  // Helper functions

  // Get the sidebar widget object from the SDK
  const getSidebarWidget = () => appSdk?.location?.SidebarWidget;

  // Return the 'empty' version of the provided value
  function getEmptyValue(value: JsonValue): JsonValue {
    switch (typeof value) {
      case 'string': return '';
      case 'number': return 0;
      case 'boolean': return false;
      case 'object':
        if (value === null) return null;
        if (Array.isArray(value)) return [];
        return emptyJsonValues(value);
      default:
        throw new Error('Unsupported type');
    }
  }

  // Empty the JSON values; if file_size exists, return null
  function emptyJsonValues(obj: JsonObject): JsonObject | null {
    if (obj.hasOwnProperty("file_size")) return null;
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = getEmptyValue(obj[key]);
      return acc;
    }, {} as JsonObject);
  }

  // Reset the entry data
  function resetEntry() {
    if (!appSdk) return;

    const sidebarWidget = getSidebarWidget();
    if (!sidebarWidget) return;

    const contentTypeUid = sidebarWidget.entry.content_type.uid;
    const entryUid = sidebarWidget.entry.getData().uid;
    const locale = sidebarWidget.entry.getData().locale;

    appSdk.stack.ContentType(contentTypeUid).Entry(entryUid).fetch().then((entry: any) => {
      const payload = emptyJsonValues(entry);
      appSdk
        .stack
        .ContentType(contentTypeUid)
        .Entry(entryUid)
        .fetch()
        .then((entry: any) => {
          const payload = emptyJsonValues(entry);
          return appSdk.stack.ContentType(contentTypeUid).Entry(entryUid).update(payload, locale);
        })
        .then(() => {
          setShowDialog(true);
          setSuccess(true)
          console.log("Successfully reset entry", showDialog);
        })
        .catch((error: any) => {
          setShowDialog(true);
          setSuccess(false);
          console.error("Error resetting the entry:", error);
        });
    })
  }

  return (
    <div className="container type-spacing-relaxed">
      <div className="row">
        <div className="col-12 asset-sidebar-icon">
          <Icon icon="Reference" size="large" />
        </div>
      </div>
      <div className="row sm-pad">
        <div className="col-12">
          <HelpText>
            Click this button to reset this entry to an empty state.
          </HelpText>
          <hr />
        </div>
      </div>
      <div className="row sm-pad">
        <div className="col-12 asset-sidebar-icon">
          <ButtonGroup>
            <Button icon="PublishWhite" onClick={resetEntry}>
              Reset Entry
            </Button>
          </ButtonGroup>
        </div>
      </div>
      { showDialog && (
      <div className="row sm-pad">
        <div className="col-12">
          <NotificationComponent success={success}/>
        </div>
      </div>
      )}
    </div>
  );
};

export default EntrySidebarExtensionResetEntry;

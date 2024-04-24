import { useEffect, useRef } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { Icon } from "@contentstack/venus-components";
import "@contentstack/venus-components/build/main.css";
import { ICustomField } from '@contentstack/app-sdk/dist/src/types';

declare global {
  interface Window {
    iframeRef: any,
    postRobot: any;
  }
}

function EntrySidebarExtension() {

  let customField: ICustomField | null;
  let entry;

  function checkValues(entry: any, fields: string[]) {
    let isValid = false;  
    fields.forEach((field) => {
      if (entry[field] !== null && entry[field] !== undefined) {
        console.log("Valid");
        isValid = true;  
      }
    });
    if (isValid) {
      customField?.field.setData("valid");
    } else {
      customField?.field.setData(null);
    }
  }


  useEffect(() => {
    ContentstackAppSDK.init().then((sdk) => {
      sdk?.location?.CustomField?.frame.updateHeight(0)
      let fields = sdk.location.CustomField?.fieldConfig.fields;
      entry = sdk?.location?.CustomField?.entry;
      customField = sdk?.location?.CustomField;
      entry.onSave((entry: any) => {
        checkValues(entry, fields);
      })
    })
  }, []);

  return (
    <>
    </>
  );
};

export default EntrySidebarExtension;

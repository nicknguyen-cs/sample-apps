import Icon from '../images/sidebarwidget.svg';
import { useEffect, useRef } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { Button, ButtonGroup, cbModal, ModalBody, ModalFooter, ModalHeader, TextInput } from "@contentstack/venus-components";
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

  function checkValues (entry: any) {
    let regex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
    if (regex.test(entry.single_line)) {
      customField?.field.setData("valid");
    } else {
      customField?.field.setData("");
    }
  }

  useEffect(() => {
    ContentstackAppSDK.init().then((sdk) => {
      sdk?.location?.CustomField?.frame.updateHeight(100)
      entry = sdk?.location?.CustomField?.entry;
      customField = sdk?.location?.CustomField;
      customField?.field.setData("");
      entry.onSave((entry : any) => {
        checkValues(entry);
      })
    })
  }, []);

  return (
    <TextInput
      disabled
      type="text"
    />
  );
};

export default EntrySidebarExtension;

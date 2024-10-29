import React, { useEffect, useRef } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { Button, cbModal, EntryReferenceDetails } from "@contentstack/venus-components";
import "@contentstack/venus-components/build/main.css";
import SelectModal from "./AssetModal";
import { set } from "lodash";

declare global {
  interface Window {
    iframeRef: any;
  }
}

function CustomFieldAssetSelector() {
  const ref = useRef(null);
  const [sdk, setSdk] = React.useState<any>(null);
  const [references, setReferences] = React.useState<any>(null);

  useEffect(() => {
    ContentstackAppSDK.init().then((sdk: any) => {
      // The snapshot of referenced DOM Element will render in-place of custom field when modal is opened
      const iframeWrapperRef = ref.current;
      // or
      // const iframeWrapperRef = document.getElementById('root')
      window.iframeRef = iframeWrapperRef;

      window.postRobot = sdk.postRobot;
      setSdk(sdk);
      setReferences(sdk?.location?.CustomField?.field?.getData());
      sdk?.location.CustomField.frame.enableAutoResizing();
    });
  }, []);

  const handleClick = (e: any) => {
    cbModal({
      component: (props: any) => <SelectModal {...props} sdk={sdk} setReferences={setReferences} />,
      modalProps: {
        size: "max",
      },
    });
  };

  return (
    <div ref={ref} className="extension-wrapper">
      <div className="btn-wrapper">
        <Button buttonType="tertiary-outline" onClick={handleClick}>
          Choose a file
        </Button>
      </div>
      <br/>
      <div>
        { sdk?.location?.CustomField?.field?.getData()?.map((reference: any) => (
          <EntryReferenceDetails
            contentType="Assets"
            onDelete={function noRefCheck(){console.log("onDelete")}}
            title={reference.uid}
          />
        ))}
      </div>
    </div>
  );
}

export default CustomFieldAssetSelector;

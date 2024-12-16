import { useEffect, useRef, useState } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { Button, Field, FieldLabel, TextInput } from "@contentstack/venus-components";
import "@contentstack/venus-components/build/main.css";
import "./CustomField.css";

function CustomField() {
  /*
  const iframeWrapperRef = useRef<HTMLDivElement>(null);
  const [appSdk, setAppSdk] = useState<any>(null); // Consider defining a more specific type for the SDK
  const [disabled, setDisabled] = useState(false);

  const fetchContentstackEntry = async (contentTypeUID, entryUID) => {
    const endpoint = `https://api.contentstack.io/v3/content_types/${contentTypeUID}/entries/${entryUID}`;
    const apiKey = "YOUR_API_KEY"; // Replace with your actual API key
    const deliveryToken = "YOUR_DELIVERY_TOKEN"; // Replace with your actual delivery token

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          api_key: apiKey,
          access_token: deliveryToken,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.error("Error fetching entry:", error);
    }
  };

  useEffect(() => {
    const initializeSDK = async () => {
      const sdk = await ContentstackAppSDK.init();
      window.iframeRef = iframeWrapperRef.current; // Consider avoiding direct assignments to `window`
      window.postRobot = sdk.postRobot; // Same as above
      setAppSdk(sdk);
      let entry = await appSdk.location.CustomField.entry.getData();
      if (entry.log) {
        let log = entry.log[0];
        sdk.stack
          .ContentType("log")
          .Entry(entry.uid)
          .getReferences()
          .then((entry: any) => {
            console.log(entry);
          })
          .catch();
        console.log(log);
      }
    };
    initializeSDK();
  }, []);

  const submitLog = () => {
    console.log("DATA: ", appSdk.location.CustomField.entry.getData());
  };

  return (
    <div style={{ width: "300px" }}>
      <FieldLabel htmlFor="Publish Comment">Publish Comment</FieldLabel>
      <TextInput name="label" placeholder="Enter your comment to publish..." />
      <Button buttonType="primary" disabled={disabled} onClick={submitLog}>
        Submit Comment
      </Button>
    </div>
  );
}
*/
}
export default CustomField;

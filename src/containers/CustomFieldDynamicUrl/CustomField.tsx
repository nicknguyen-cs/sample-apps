// Import necessary libraries and components
import { Select } from "@contentstack/venus-components";
import { useEffect } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";

const CustomFieldSelector: React.FC = () => {
  // This useEffect hook initializes the Contentstack SDK upon component mount.
  // It updates the custom field height and sets the 'url' data based on the locale.
  useEffect(() => {
    ContentstackAppSDK.init().then((appSdk) => {
      const customField = appSdk?.location?.CustomField;
      customField?.frame.updateHeight(0);
      const url = customField?.entry.getData().url;
      let e = customField?.entry.getData();

      const newSlug = `${url}?origin=gcp&preview=x`;
      customField?.entry.getField("url")?.setData(newSlug);

      appSdk?.location?.CustomField?.entry.onSave(async () => {
        let parsedUrl = customField?.entry.getData().url.replace(/\?.*$/, "");
        let entryCustomField = customField?.entry;
        entryCustomField.getField("url")?.setData(parsedUrl);
        let entry = entryCustomField.getData();
        entry.url = parsedUrl;
        let payload = {
            entry
        };
        console.log(payload);
        await appSdk.stack.ContentType(entryCustomField.content_type.uid).Entry(entry.uid).update(payload).then().catch();
        customField?.entry.getField("url")?.setData(newSlug);
      });
    });
  }, []);

  return <div></div>;
};

// Export the component for use in other parts of the application.
export default CustomFieldSelector;

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

      // Update custom field frame height to basically be least visible as possible.
      customField?.frame.updateHeight(0);

      const locale = customField?.entry.getData().locale;
      const url = customField?.entry.getData().url;

      let e = customField?.entry.getData()
      console.log(e.height)

      // Checks to see if the URL is already containing a locale code. This logic can be worked on for personal use case.
      if (url && locale && url.indexOf(locale) !== 1) {
        console.log(e.height)
        const newSlug = `/${locale}${url}bose/sandbox/environment?height=${e.height}`;
        customField?.entry.getField('url')?.setData(newSlug);
      }
    });
  }, []);

  return <div></div>;
};

// Export the component for use in other parts of the application.
export default CustomFieldSelector;

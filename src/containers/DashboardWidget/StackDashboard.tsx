import Icon from "../../assets/Icon.svg";
import localeTexts from "../../common/locales/en-us/index";
import parse from "html-react-parser";
import { Select } from "@contentstack/venus-components";
import { useEffect, useState } from "react";
import AppSDK from "@contentstack/app-sdk";

const StackDashboardExtension = () => {

  let [contentTypes, setContentTypes] = useState<any[]>([]);
  useEffect(() => {
    AppSDK.init().then(async (sdk) => {
      console.log(sdk.stack._data.user_uids);
      await sdk.stack.getContentTypes().then(async (data) => {
        let newContentTypes: any = []; // Create a new array
        data.content_types.forEach((contentType: any, index: any) => {
          newContentTypes.push({ "id": index, "label": contentType.title, "value": contentType.uid }); // Push into the new array
        })
        setContentTypes(newContentTypes); // Set state once
      })
    })
  }, []);

  return (
    <div className="dashboard">
      <Select
        hideSelectedOptions
        maxMenuHeight={200}
        noOptionsMessage={function noRefCheck() { }}
        onChange={function noRefCheck() { }}
        placeholder="Empty"
        selectLabel="Content Type"
        value={null}
        width="200px"
        options={contentTypes}
      />
    </div>
  );
};

export default StackDashboardExtension;

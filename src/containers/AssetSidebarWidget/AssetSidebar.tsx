import Icon from "../../assets/assetsidebar.svg";
import localeTexts from "../../common/locales/en-us/index";
import parse from "html-react-parser";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { useState, useEffect } from "react";

const AssetSidebarExtension = () => {

  const [scs, setScs] = useState("")
  const [currentAsset, setCurrentAsset] = useState<any>()
  const [locationUid, setLocationUid] = useState<any>()
  const [metadataUid, setMetadataUid] = useState<any>()

  useEffect(() => {
    ContentstackAppSDK.init().then(async function (appSdk) {
      let asset = appSdk.location.AssetSidebarWidget?.currentAsset
      setCurrentAsset(asset);
      setLocationUid(appSdk.locationUID)
      if (asset?._metadata) {
        setScs(asset?._metadata.extensions[appSdk.locationUID][0].demo_metadata)
        setMetadataUid(asset?._metadata.extensions[appSdk.locationUID][0].uid);
      } 
    })
  }, [])

  return (
    <div className="asset-sidebar">
      <div className="asset-sidebar-container">
        <div className="asset-sidebar-icon" style={{textAlign: "left"}}>
          Extension UID: {locationUid}
          <br />
          Metadata UID: {metadataUid}
          <br/>
          Metadata: {scs}
        </div>
      </div>
    </div>
  );
};

export default AssetSidebarExtension;

import React, { useEffect, useRef } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { Button, cbModal, EntryReferenceDetails, Icon } from "@contentstack/venus-components";
import "@contentstack/venus-components/build/main.css";
import SelectModal from "./AssetModal";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

declare global {
  interface Window {
    iframeRef: any;
  }
}

function CustomFieldAssetSelector() {
  const ref = useRef(null);
  const [sdk, setSdk] = React.useState<any>(null);
  const [references, setReferences] = React.useState<any>(null);
  const [assets, setAssets] = React.useState<any[]>([]); // State to hold fetched assets
  const [loading, setLoading] = React.useState<boolean>(true); // State to handle loading
  const [stackUid, setStackUid] = React.useState<string>("");

  const apiKey = "";
  const authorization = "";

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
      sdk?.location.CustomField.frame.updateHeight(375);
    });
  }, []);

  const handleClick = (e: any) => {
    cbModal({
      component: (props: any) => (
        <SelectModal {...props} sdk={sdk} setReferences={setReferences} references={references} />
      ),
      modalProps: {
        size: "max",
      },
    });
  };

  const handleDelete = (data: any) => {
    const filtered = references.filter((item: { uid: any }) => !(item.uid === data.uid));
    sdk.location.CustomField.field.setData(filtered);
    setReferences(filtered);
  };

  type AssetData = { file: string }; // Define the expected structure for clarity

  const getAssetData = async (uid: string): Promise<AssetData> => {
    const url = `https://api.contentstack.io/v3/content_types/assets/entries/${uid}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          api_key: apiKey,
          authorization: authorization,
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch asset: ${response.statusText}`);
      const data = await response.json();
      return data.entry;
    } catch (error) {
      console.error(`Error fetching asset ${uid}:`, error);
      throw error; // Rethrow or handle based on requirements
    }
  };

  const getAssets = async () => {
    try {
      setLoading(true);
      if (!references || references.length === 0) {
        setAssets([]);
        return;
      }
      const response = await Promise.all(
        references.map(async (reference: any) => {
          const entry = await getAssetData(reference.uid);
          return { entry };
        })
      );
      console.log(response);
      setAssets(response);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (references) {
      getAssets();
    }
  }, [references]);

  return (
    <div ref={ref} className="extension-wrapper">
      <div className="btn-wrapper">
        <Button buttonType="tertiary-outline" icon="InternalLink" onClick={handleClick}>
          Choose existing entry
        </Button>
        <span style={{ fontSize: ".8rem", padding: "0 1rem", display: "inline-block" }}>or</span>
        <Button buttonType="tertiary-outline" icon="NewEntry" onClick={function noref(){}}>
          Create new entry
        </Button>
      </div>
      <br />
      <div style={{border : "1px solid #DDE3EE"}}>
        {loading ? (
          <p>Loading assets...</p>
        ) : (
          <Carousel showArrows={true} showThumbs={true} dynamicHeight={false} width={250}>
            {assets.map((entry: any) => (
              <div key={entry.uid}>
                <img src={entry.entry.file.url} alt={entry.entry.file.url || "Asset"} />
                <a 
                  href={`https://app.contentstack.com/#!/stack/${apiKey}/content-type/assets/en-us/entry/${entry.entry.uid}/edit?branch=main`} 
                  target="_blank" 
                  className="legend"
                >
                  {entry.entry.title || "Untitled Asset"}
                </a>
              </div>
            ))}
          </Carousel>
        )}
      </div>
    </div>
  );
}

export default CustomFieldAssetSelector;

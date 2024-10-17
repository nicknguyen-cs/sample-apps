import "@contentstack/venus-components/build/main.css";
import "./CustomField.css";
import { useEffect, useState } from "react";
import { FieldLabel, Field } from "@contentstack/venus-components";
import ContentstackAppSDK from "@contentstack/app-sdk";

declare global {
  interface Window {
    iframeRef: any;
    postRobot: any;
    queryParams: any;
  }
}

function CustomFieldDisplay() {
  let [currentData, setCurrentData] = useState<any>({});

  useEffect(() => {
    const initializeSDK = async () => {
      const appSDK = await ContentstackAppSDK.init();
      const branch_details = appSDK.stack.getCurrentBranch()
console.log("BRANCH DETAILS: ", branch_details);
      var customField = appSDK?.location?.CustomField?.entry.getData();
      appSDK?.location?.CustomField?.frame.updateHeight(400);
      setCurrentData(customField);
      console.log("DATA: " , customField);
    };
    initializeSDK();
  }, []);


  function getDate(isoDate: any) {
    let date = new Date(isoDate);
    let options: any = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
      timeZoneName: "short",
    };
    return date.toLocaleString("en-US", options);
  }

  return (
    <div className="">
      <div className="field">
        <label htmlFor="WorkflowStage">Workflow Stage:</label>
        <span style={{ color: currentData._workflow?.color }}>
          {currentData._workflow?.name || "N/A"}
        </span>
      </div>
      <div className="field">
        <label htmlFor="WorkflowStage">Modified By:</label>
        <span>{currentData.updated_by || "N/A"}</span>
      </div>
      <div className="field">
        <label htmlFor="WorkflowStage">Modified At:</label>
        <span>{getDate(currentData.updated_at) || "N/A"}</span>
      </div>
      <div className="field">
        <label htmlFor="WorkflowStage">Publish Status By Environment:</label>
        <PublishedFormat publishDetails={currentData.publish_details} currentVersion={currentData._version} />
      </div>
    </div>
  );
}

async function getEnvironments() {
  const response = await fetch(`https://api.contentstack.io/v3/environments`, {
    headers: {
      'api_key': "blt8f285fdea6372037",
      'authorization': "csb8bbb9b9bc5d4fb38849d066"
    }
  });
  const result = await response.json();
  return result.environments;
}


function PublishedFormat({publishDetails, currentVersion} : any) {
  const [environmentNames, setEnvironmentNames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnvironmentNames = async () => {
      const names = await getEnvironments();
      setEnvironmentNames(names);
      setLoading(false);
    };

    if (publishDetails && publishDetails.length > 0) {
      fetchEnvironmentNames();
    } else {
      setLoading(false);
    }
  }, [publishDetails]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!publishDetails || publishDetails.length === 0) {
    return <div>Not Published</div>;
  }

  const getEnvironmentNameByUid = (uid : any) => {
    const environment : any = environmentNames.find((env : any) => env.uid === uid);
    return  environment ? environment.name.charAt(0).toUpperCase() +environment.name.slice(1) : "Unknown"
  };

  function isCurrentVersionPublished(version: number) {
      return currentVersion === version ? <span style={{ color: "green" }}> Version {version} </span> :  <span style={{ color: "red" }}> Version {version} </span>;
  }

  return (
    <ul>
      {publishDetails.map((detail : any, index : any) => (
        <li key={index}>
          {getEnvironmentNameByUid(detail.environment)} : {isCurrentVersionPublished(detail.version)}
        </li>
      ))}
    </ul>
  );
}

export default CustomFieldDisplay;

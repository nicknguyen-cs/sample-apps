import React from "react";
import ContentstackSDK from "@contentstack/app-sdk";
import parse from "html-react-parser";
import editIcon from "./public/edit.svg";
import plugin from "./public/plugin.svg";
import localeTexts from "./common/locales/en-us/index";
import "./index.css";
import { ActionTooltip, Icon, Tooltip } from "@contentstack/venus-components";
import { Action } from "@remix-run/router";

export default ContentstackSDK.init().then(async (sdk) => {
  const extensionObj = await sdk["location"];
  const RTE = await extensionObj["RTEPlugin"];
  if (!RTE) return;


  async function fetchWordDefinition(word: any) {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}}`);
    } else {
      const data = await response.json();
      console.log(data);
    }
  }

  const RtePlugin = RTE("RTE Plugin", () => ({
    title: "Demo-Plugin",
    icon: <img style={{ padding: "0 6px" }} src={editIcon} />,
    render: (props: any) => {
      return (
        <>
          <Tooltip
            content={
              <Icon
                icon={"Document"}
                size="small"
                onClick={() => fetchWordDefinition(props.children)}
              />
            }
            position="top"
            type="primary"
            variantType="light"
          >
            {props.children}
          </Tooltip>
        </>
      );
    },
    display: ["hoveringToolbar"],
    elementType: ["text"],
  }));


  return {
    RtePlugin,
  };
});

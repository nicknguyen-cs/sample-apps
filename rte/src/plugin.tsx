import React from "react";
import ContentstackSDK from "@contentstack/app-sdk";
import { Icon, cbModal } from "@contentstack/venus-components";
import "./index.css";
import Embed from "./components/embed";
import EmbedModal from "./components/EmbedModal";
import '@contentstack/venus-components/build/main.css'

export default ContentstackSDK.init().then(async (sdk) => {
  const extensionObj = await sdk["location"];
  const RTE = await extensionObj["RTEPlugin"];


  if (!RTE) return;

  const RtePlugin = RTE("embed", () => ({
    title: "Embed",
    icon: <Icon icon="Embed" size="small" />,
    render: Embed,
    display: ["toolbar"],
    elementType: ["void"],
  }));

  RtePlugin.on("exec", (rte: any) => {
    let config =rte.getFieldConfig();
    const savedSelection = rte.selection.get();
    cbModal({
      component: (props: any) => (
        <EmbedModal savedSelection={savedSelection} rte={rte} update={false} {...props} />
      ),
      modalProps: {
        shouldReturnFocusAfterClose: false,
      },
    });
  });

  return {
    RtePlugin,
  };
});

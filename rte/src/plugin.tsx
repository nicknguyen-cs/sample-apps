import React from "react";
import ContentstackSDK from "@contentstack/app-sdk";
import { cbModal } from "@contentstack/venus-components";
import editIcon from "./public/edit.svg";
import "./index.css";
import Embed from "./components/embed";
import EmbedModal from "./components/EmbedModal";

export default ContentstackSDK.init().then(async (sdk) => {
  const extensionObj = await sdk["location"];
  const RTE = await extensionObj["RTEPlugin"];

  if (!RTE) return;

  const RtePlugin = RTE("embed", () => ({
    title: "Embed",
    icon: <img style={{ padding: "0 6px" }} src={editIcon} />,
    render: Embed,
    display: ["toolbar"],
    elementType: ["void"],
  }));

  RtePlugin.on("exec", (rte) => {
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

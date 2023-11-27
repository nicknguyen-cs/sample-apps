import React, { useEffect, useRef, useState } from 'react';
import ContentstackAppSDK from '@contentstack/app-sdk';
import { Button, HelpText, Icon, Checkbox, FieldLabel, cbModal, ToggleSwitch, AsyncLoader } from '@contentstack/venus-components';
import Modal from "../../components/CloneComponents/CloneModal";
import '@contentstack/venus-components/build/main.css';
import './clone.css'
import { AppSDK, EntryNode, Settings } from '../../types/cloneTypes';
import { getParentNode } from '../../services/clone/services';

const EntrySidebarExtensionDeepClone: React.FC = () => {
  // State declarations
  const [appSDK, setAppSDK] = useState<AppSDK | null>(null);
  const [contentTypeUid, setContentTypeUid] = useState<string>('');
  const [installationData, setInstallationData] = useState<any>(null);

  const [settings, setSettings] = useState<Settings>({
    includeDeepClone: false,
    includeAllLanguages: false,
    includeAllReferences: false
  });
  const ref = useRef(null);

  // Initialize the app and set necessary state values
  useEffect(() => {
    const initializeApp = async () => {
      const sdk = await ContentstackAppSDK.init();
      const iframeWrapperRef = document.getElementById('root')
      window.iframeRef = iframeWrapperRef;
      window.postRobot = sdk.postRobot
      const sidebarWidget = sdk.location?.SidebarWidget;
      const contentType = await sidebarWidget?.entry.content_type;
      const installationData = await sdk.getConfig();
      setInstallationData(installationData)
      setContentTypeUid(contentType.uid);
      setAppSDK(sdk);
      let set = new Set<string>();
      let parentNode = await getParentNode(sdk, true, contentType.uid);
      generateList(parentNode, set);
    };
    initializeApp();
  }, []);

  const handleClick = (e: any) => {
    cbModal({
      component: (props: any) => (<Modal modalProps={props} appSDK={appSDK} contentTypeUID={contentTypeUid} config={installationData} />),
      modalProps: {
        size: "max"
      }
    })
  }

  async function generateList(node: EntryNode, map: Set<string>) {
    if (node.visited) return;
    node.visited = true;

    for (const neighbor of node.neighbors) {
      map.add(neighbor.entry.uid)
      generateList(neighbor, map)
    }

  }

  return (
    <div className="container type-spacing-relaxed">
      <div className="entry-sidebar-icon">
        <Icon icon="Reference" size="large" />
      </div>
      <HelpText>
        Open the clone window to begin cloning process.
      </HelpText>
      <hr />
      <div className="row">
        <div className="col-12 sm-pad">
          <Button icon="PublishWhite" onClick={handleClick}>
            Open Clone Window
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EntrySidebarExtensionDeepClone;

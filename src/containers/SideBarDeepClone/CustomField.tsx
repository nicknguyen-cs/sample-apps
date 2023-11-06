import React, { useEffect, useRef, useState } from 'react';
import ContentstackAppSDK from '@contentstack/app-sdk';
import { Button, HelpText, Icon, Checkbox, FieldLabel, cbModal, ToggleSwitch, AsyncLoader } from '@contentstack/venus-components';
import Modal from "../../components/CloneComponents/Modal";
import MiniTable from "../../components/CloneComponents/MiniTable";

import '@contentstack/venus-components/build/main.css';
import './clone.css'
import { min, set } from 'lodash';
import { AppSDK, Settings } from '../../types/cloneTypes';

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
      window.postRobot = sdk.postRobot;
      setAppSDK(sdk);
      const iframeWrapperRef = document.getElementById('root')
      //  @ts-ignore
      window.iframeRef = iframeWrapperRef;
      window.postRobot = sdk.postRobot
      const sidebarWidget = sdk.location?.SidebarWidget;
      const contentType = await sidebarWidget?.entry.content_type;
      const installationData = await sdk.getConfig();
      setInstallationData(installationData)
      setContentTypeUid(contentType.uid);
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

  const toggleSetting = (settingKey: keyof Settings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [settingKey]: !prevSettings[settingKey]
    }));
  };

  return (
    <div className="container type-spacing-relaxed">
      <div className="entry-sidebar-icon">
        <Icon icon="Reference" size="large" />
      </div>
      <HelpText>
        Select options to clone this entry.
      </HelpText>
      <hr />
      <div className="row">
        <FieldLabel htmlFor="languages">Settings</FieldLabel>
      </div>
      <div className="row">
        <div className='col-12 sm-pad'>
          <Checkbox
            label={"Include All Languages"}
            id="languages"
            checked={settings.includeAllLanguages}
            isButton={false}
            isLabelFullWidth={true}
            onChange={() => toggleSetting("includeAllLanguages")}
          />
        </div>
      </div>
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

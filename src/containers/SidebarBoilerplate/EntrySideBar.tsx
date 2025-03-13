import React, { useEffect, useState } from 'react';
import { Button } from '@contentstack/venus-components';
import ContentstackAppSDK from '@contentstack/app-sdk';
import '@contentstack/venus-components/build/main.css';
import { AppSDK } from '../../types/cloneTypes';

const EntrySidebar: React.FC = () => {
  // State declarations
  const [sdk, setSdk] = useState<AppSDK | null>(null);
  const [configData, setConfigData] = useState<any>(null);

  // Initialize the app and set necessary state values
  useEffect(() => {
    const initializeApp = async () => {
      const sdk = await ContentstackAppSDK.init();
      const configData = await sdk.getConfig();
      setConfigData(configData);
      setSdk(sdk);
    };
    initializeApp();
  }, []);

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Example function
  };

  return (
    <div className="container type-spacing-relaxed">
      <Button onClick={handleButtonClick} className="button-primary">
        Example Button
      </Button>
    </div>
  );
};

export default EntrySidebar;
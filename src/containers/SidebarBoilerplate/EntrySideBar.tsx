import React, { useEffect, useState } from "react";
import { Button } from "@contentstack/venus-components";
import ContentstackAppSDK from "@contentstack/app-sdk";
import "@contentstack/venus-components/build/main.css";
import { AppSDK } from "../../types/cloneTypes";

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

  const designTokens = {
    colors: [
      { name: "Background Color", type: "color", value: "#ffffff" },
      { name: "Text Color", type: "color", value: "#000000" },
    ],
    alignment: [
      { name: "Text Alignment", type: "select", value: "left", options: ["left", "center", "right"] },
    ],
    spacing: [
      { name: "Padding", type: "text", value: "1rem" },
      { name: "Margin", type: "text", value: "1rem" },
    ],
  };
  

  const copyToClipboard = (text: any) => {
    navigator.clipboard.writeText(text);
  };

  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    Object.values(designTokens).forEach((tokens) => {
      tokens.forEach((token) => {
        initial[token.name] = token.value;
      });
    });
    return initial;
  });

  const handleChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ padding: '1rem' }}>
      {Object.entries(designTokens).map(([category, tokens]) => (
        <div key={category} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'capitalize' }}>{category}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {tokens.map((token) => (
              <div
                key={token.name}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <label style={{ fontWeight: '500' }}>{token.name}</label>
                {token.type === "color" && (
                  <input
                    type="color"
                    value={formValues[token.name]}
                    onChange={(e) => handleChange(token.name, e.target.value)}
                  />
                )}
                {token.type === "select" && 'options' in token && (
                  <select
                    value={formValues[token.name]}
                    onChange={(e) => handleChange(token.name, e.target.value)}
                  >
                    {token.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {token.type === "text" && (
                  <input
                    type="text"
                    value={formValues[token.name]}
                    onChange={(e) => handleChange(token.name, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Selected Values</h3>
        <ul>
          {Object.entries(formValues).map(([name, value]) => (
            <li key={name} style={{ fontSize: '0.95rem' }}>{name}: {value}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EntrySidebar;

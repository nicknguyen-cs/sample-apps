import Icon from '../images/sidebarwidget.svg';
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { Button, ButtonGroup, cbModal, ModalBody, ModalFooter, ModalHeader, Select } from "@contentstack/venus-components";
import "@contentstack/venus-components/build/main.css";
import "./CustomField.css"

declare global {
  interface Window {
    iframeRef: any,
    postRobot: any;
    queryParams: any;
  }
}

type Country = {
  name: string;
  cities: string[];
};


function EntrySidebarExtension() {

  const iframeWrapperRef = useRef<HTMLDivElement>(null);
  const [sdk, setSDK] = useState<any>(null); // Consider defining a more specific type for the SDK
  const [countries, setCountries] = useState<any[]>([]); // Consider using a more specific type instead of any
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    const initializeSDK = async () => {
      const sdk = await ContentstackAppSDK.init();
      window.iframeRef = iframeWrapperRef.current; // Consider avoiding direct assignments to `window`
      window.postRobot = sdk.postRobot; // Same as above

      setSDK(sdk);

      const fieldConfig = await sdk?.location?.CustomField?.fieldConfig;
      setCountries(fieldConfig?.countries || []);

      const data = sdk?.location?.CustomField?.field.getData();
      // Directly setting data after getting it seems redundant unless there's a specific need
      // sdk.location.CustomField.field.setData(data);

      if (data?.country) {
        setSelectedCountry(data.country);
        const country = fieldConfig?.countries.find((country: { name: string; }) => country.name === data.country);
        setCities(country?.cities || []);
        if (data.city) {
          setSelectedCity(data.city);
        }
      }
    };

    initializeSDK();
  }, [])

  // Handle country selection
  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const countryName = event.target.value;
    sdk.location.CustomField.field.setData({ country: countryName });
    setSelectedCountry(countryName);
    const country = countries.find((country) => country.name === countryName);
    setCities(country ? country.cities : []);
  };

  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = event.target.value;
    let data = sdk.location.CustomField.field.getData()
    data = { ...data, city: cityName }
    console.log(data)
    setSelectedCity(cityName);
    sdk.location.CustomField.field.setData(data);
  }


  return (
    <div style={{ width: "300px" }}>
      <label htmlFor="country">Country:</label>
      <select value={selectedCountry} onChange={handleCountryChange}>
        <option value="">Select a country</option>
        {countries.map((country) => (
          <option key={country.name} value={country.name}>
            {country.name}
          </option>
        ))}
      </select>
      <label htmlFor="city">City:</label>
      <select value={selectedCity} disabled={!selectedCountry} onChange={handleCityChange}>
        <option value="">Select a city</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </div>
  );
};

export default EntrySidebarExtension;

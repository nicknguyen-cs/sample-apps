// Import necessary libraries and components
import { Select } from "@contentstack/venus-components";
import ContentstackSDK from "@contentstack/app-sdk";
import { useEffect, useState, useCallback } from "react";

const ExampleSelector = () => {
  const [selectedValue, setExampleAPIData] = useState("");
  const [APIValue, setAPIValue] = useState("");
  const [options, setOptions] = useState<any>([]);
  const [contentstackSDK, setContentstackSDK] = useState<any>();

  // This function fetches example data from an API and sets it as options for our second Select input. You can change this to any API endpoint you want, so something like a personalization engine.
  const fetchExampleData = useCallback(() => {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=151')
      .then(response => response.json())
      .then((data) => {
        // Using .map to create an array of option objects for the Select input
        const options = data.results.map((result: { name: any; }) => ({
          label: result.name,
          value: result.name
        }));
        setOptions(options);
      })
      .catch(error => console.error('Error:', error));
  }, []);

  // This useEffect hook runs once after the initial render
  // It initializes the Contentstack SDK and fetches the pokemon example API data
  useEffect(() => {
    ContentstackSDK.init().then((sdk) => {
      setContentstackSDK(sdk);
      fetchExampleData();
      sdk?.location?.CustomField?.frame.updateHeight(200)
      let fieldData = sdk?.location?.CustomField?.field.getData();
      setExampleAPIData(fieldData)
    })
  }, [fetchExampleData]);

  // This function updates the selectedPokemon state variable and sets the data of the custom field
  const updateExampleData = async (e: any) => {
    setExampleAPIData(e)
    const customField = await contentstackSDK.location.CustomField;
    customField.field.setData(e);
  }

  // The component returns a JSX element with two Select inputs
  return (
    <div className="row">
      <h2> Hello World! CBL Properties </h2>
      <div className="col-4">
        {/* This Select input lets the user select their audience */}
        <Select
          onChange={(e: any) => { updateExampleData(e) }}
          options={[
            {
              label: 'Male',
              value: "male"
            },
            {
              label: 'Female',
              value: 'female'
            },
            {
              label: 'Non-Binary',
              value: "non-binary"
            }
          ]}
          placeholder="Select Audience"
          selectLabel="Audience"
          width="200px"
          value={selectedValue}
        />
      </div>
      <div className="col-4">
        {/* This Select input lets the user select a choice from the fetched data */}
        <Select
          value={null}
          options={options}
          placeholder="Select a Pokemon"
          selectLabel="Example API Selection"
          onChange={function () { }}
          maxMenuHeight={100}
        />
      </div>
    </div >
  );
};

// Export the component so it can be imported in other files
export default ExampleSelector;

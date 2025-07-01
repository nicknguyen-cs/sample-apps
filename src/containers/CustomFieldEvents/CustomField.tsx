import { useEffect, useState } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { Select } from "@contentstack/venus-components";
import "@contentstack/venus-components/build/main.css";
import { ICustomField } from "@contentstack/app-sdk/dist/src/types";

function CustomFieldEvents() {
  let [appSDK, setAppSDK] = useState<any>();
  let [events, setEvents] = useState<any>();
  let [selected, setSelected] = useState<any>();

  useEffect(() => {
    ContentstackAppSDK.init().then((sdk: any) => {
      setAppSDK(sdk);
      sdk?.location?.CustomField?.frame.updateHeight(200);
      fetch("https://personalize-api.contentstack.com/events", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          authtoken: "blt27b09129a08d7f1a",
          "x-project-uid": "6734eae6603c9640f5808e78",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          const path = sdk?.location?.CustomField?.field.schema.$uid;
          const currentValue = sdk?.location?.CustomField?.entry.getField(path).getData();
          const eventsArray = data.map((item: any, index: number) => ({
            id: index,
            label: item.key,
            value: item.key,
          }));
          setEvents(eventsArray);

          // Find the object in eventsArray that matches the current value
          const selectedEvent = eventsArray.find((event: any) => {
            if (event.value === currentValue) {
              sdk?.location?.CustomField?.field.setData(event.value);
            }
            return event.value === currentValue;
          });
          setSelected(selectedEvent || ""); // Set to null if no match is found
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    });
  }, []);

  const onSelect = (e: any) => {
    setSelected(e);
    console.log(e);
    appSDK?.location?.CustomField?.field.setData(e.value);
  };

  return (
    <>
      <Select
        hideSelectedOptions
        maxMenuHeight={200}
        noOptionsMessage={function noRefCheck() {}}
        onChange={(e: any) => {
          onSelect(e);
        }}
        options={events}
        placeholder="Select Title"
        selectLabel="Select Event Type"
        value={selected}
        width="200px"
      />
    </>
  );
}

export default CustomFieldEvents;

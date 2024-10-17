import React, { useEffect, useState } from "react";
import { ModalFooter, ModalBody, ModalHeader, ButtonGroup, Button } from "@contentstack/venus-components";
import { InfiniteScrollTable } from "@contentstack/venus-components";
/* eslint-disable @typescript-eslint/no-empty-function */

const SelectModal = (props: any) => {
  const [tableData, setTableData] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [entry, setEntry] = useState<any>(null);
  const [itemStatusMap, setItemStatusMap] = useState<any>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const contentType = "page";
  const assetContentType = "assets";

  async function getData() {
    // Fetch data from Contentstack
    const url = "https://api.contentstack.io/v3/content_types/assets/entries";
    const data = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        api_key: "",
        authorization: "",
      },
    });
    return await data.json();
  }

  async function fetchData() {
    const data = await getData();
    const tableData = data.entries.map((entry: any, index: number) => {
      itemStatusMap[index] = "loaded";
      return {
        url: entry.file.url,
        title: entry.file.title,
        uid: entry.uid,
        index: index,
      };
    });
    console.log(tableData);
    setTableData(tableData);
    setLoading(false);
    setCount(data.length);
  }


  const addAssets = async (rows : any) => {
    const formattedData = createReferencePayload(rows.data);
    const entry =  await props.sdk.location.CustomField.entry;
    const entryData = entry.getData();
    await props.sdk.stack.ContentType(entry.content_type.uid).Entry(entryData.uid).update({ "entry" :  { "reference" : formattedData } });
    props.closeModal();
  }

  function createReferencePayload(data : any) {
    return data.map((item: any) => {
      return {
        uid: item.uid,
        _content_type_uid: "assets",
      };
    });
  }

  return (
    <>
      <ModalHeader title={"Select Asset"} closeModal={props.closeModal} />
      <ModalBody>
        <div>Contenstack Asset Picker</div>
        <InfiniteScrollTable
          columnSelector
          isRowSelect
          viewSelector
          itemSize={100}
          columns={[
            {
              Header: "Thumbnail",
              id: "url",
              accessor: "url",
              addToColumnSelector: true,
              Cell: ({ value }: { value: string }) => (
                <img
                  src={value}
                  alt="Thumbnail"
                  style={{ width: "auto", height: "100px" }} // Custom styling for thumbnail
                />
              ),
            },
            {
              Header: "Title",
              id: "title",
              accessor: "title",
            },
            {
              Header: "Entry UID",
              id: "uid",
              accessor: "uid",
            },
          ]}
          data={tableData}
          fetchTableData={fetchData}
          equalWidthColumns={true}
          itemStatusMap={itemStatusMap}
          loading={loading}
          totalCounts={count}
          uniqueKey="url"
          onRowSelectProp={[
            {
              cb: addAssets,
              icon: 'SaveWhite',
              label: 'Add Selected Asset',
              showSelected: true
            },
          ]}
        />
      </ModalBody>
      <ModalFooter>
        <ButtonGroup>
          <Button onClick={props.closeModal} buttonType="light">
            Cancel
          </Button>
        </ButtonGroup>
      </ModalFooter>
    </>
  );
};

export default SelectModal;

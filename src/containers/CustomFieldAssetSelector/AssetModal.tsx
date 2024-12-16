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
  const apiKey = "";
  const authorization = "";

  async function getData({searchText}: {searchText: string}) {
    // Fetch data from Contentstack
    const url = `https://api.contentstack.io/v3/content_types/assets/entries?query={"title": {"$regex" : "^${searchText}", "$options": "i"}}`;
    const data = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        api_key: apiKey,
        authorization: authorization,
      },
    });
    return await data.json();
  }

  async function fetchData({searchText}: {searchText: string}) {
    const data = await getData({ searchText });
    const tableData = data.entries.map((entry: any, index: number) => {
      itemStatusMap[index] = "loaded";
      return {
        url: entry.file.url,
        title: entry.title,
        uid: entry.uid,
        index: index,
      };
    });

    setTableData(tableData);
    setLoading(false);
    setCount(data.length);
  }

  const addAssets = async (rows: any) => {
    const formattedData = createReferencePayload(rows.data);
    const entry = await props.sdk.location.CustomField.entry;
    await props.sdk.location.CustomField.field.setData(formattedData);
    props.setReferences(formattedData);
    props.closeModal();
  };

  function createReferencePayload(data: any) {
    return data.map((item: any) => {
      return {
        uid: item.uid,
        _content_type_uid: "assets",
        title: item.title,
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
          searchPlaceholder={"Search"}
          canSearch={true}
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
              Header: "Entry Title",
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
          uniqueKey="uid"
          onRowSelectProp={[
            {
              cb: addAssets,
              icon: "SaveWhite",
              label: "Add Selected Asset",
              showSelected: true,
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

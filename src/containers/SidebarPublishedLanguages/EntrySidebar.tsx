import React, { useEffect, useState } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import "@contentstack/venus-components/build/main.css";
import { Icon, InfiniteScrollTable } from '@contentstack/venus-components';
import axios from 'axios';

interface Locale {
  code: string;
  localized?: boolean;
}

interface Entry {
  publish_details: any[];
  content_type: { uid: string };
  _data: { uid: string };
}


function EntrySidebarExtension() {
  const [tableData, setTableData] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [itemStatusMap, setItemStatusMap] = useState<any[]>([]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    const sdk = await ContentstackAppSDK.init();
    const sidebarWidget = sdk.location.SidebarWidget;
    const entry = await sidebarWidget?.entry;
    const config = await sdk.getConfig();
    const locales = await sdk.stack
      .ContentType(entry.content_type.uid)
      .Entry(entry._data.uid)
      .getLanguages();
    
    fetchData(entry._data, locales.locales, config);
  };

  const fetchData = async (entry: Entry, locales: Locale[], config: any) => {
    const data = await createTableData(entry, locales, config);
    console.log("Data: ", data)
    setTableData(data);
    setLoading(false);
    setCount(data.length);
  }

  const createTableData = async (entry: Entry, locales: Locale[], config: any) => {
    if (!entry.publish_details) return [];

    const tableDataPromises = entry.publish_details.map(async (data, index) => {
      setItemStatusMap(prevMap => {
        const updatedMap = [...prevMap];
        updatedMap[index] = 'loaded';
        return updatedMap;
      });

      const name = await getEnvironmentName(data, config);
      const matchingLocale = locales.find(locale => locale.code === data.locale);
      const icon = matchingLocale?.localized ? <Icon icon='SuccessInverted' /> : null;
      return {
        index,
        env: name,
        language: data.locale,
        loc: icon
      };
    });

    return await Promise.all(tableDataPromises);
  }

  const getEnvironmentName = async (environment: any, config: any) => {
    const request = {
      method: 'GET',
      url: 'https://api.contentstack.io/v3/environments',
      headers: {
        'api_key': config.apiKey,
        'authorization': config.accessToken,
        'Content-Type': 'application/json',
      }
    };

    const response = await axios(request);
    const foundEnv = response.data.environments.find((env: any) => env.uid === environment.environment);
    return foundEnv?.name;
  }

  const columns = [
    { Header: 'Language', id: 'language', accessor: "language" },
    { Header: 'Environment', id: "env", accessor: "env" },
    { Header: 'Localized', id: "loc", accessor: "loc" }
  ]

  return (
    <div className="extension-wrapper">
      <InfiniteScrollTable
        columnSelector={function noRefCheck() { }}
        columns={columns}
        data={tableData}
        fetchTableData={fetchData}
        equalWidthColumns={true}
        itemStatusMap={itemStatusMap}
        loadMoreItems={function noRefCheck() { }}
        loading={loading}
        searchPlaceholder="Search"
        totalCounts={count}
        uniqueKey="index"
      />
    </div>
  );
};

export default EntrySidebarExtension;

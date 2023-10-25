import { useEffect, useState } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import "@contentstack/venus-components/build/main.css";
import { Icon, InfiniteScrollTable } from '@contentstack/venus-components';
import axios from 'axios';
import { AppSDK } from "../../types/cloneTypes";

function EntrySidebarExtension() {

  const [tableData, setTableData] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);
  let [loading, setLoading] = useState<boolean>(true);
  let [itemStatusMap, setItemStatusMap] = useState<any>([]);
  let [config, setConfig] = useState<any>(null);

  useEffect(() => {
    ContentstackAppSDK.init().then(async (sdk) => {
      var sidebarWidget = sdk.location.SidebarWidget;
      var entry = await sidebarWidget?.entry;
      let config = await sdk.getConfig();
      let locales = await sdk.stack
        .ContentType(entry.content_type.uid)
        .Entry(entry._data.uid)
        .getLanguages();
      fetchData(entry._data, locales, config);
    })
  }, [])

  async function fetchData(entry: any, locales: any, config: any) {
    let data = await createTableData(entry, locales.locales, config);
    setTableData(data);
    setLoading(false);
    setCount(data.length);
  }


  async function createTableData(entry: any, locales: any, config: any) {
    console.log(locales);
    var tableData: any[] = [];
    if (entry.publish_details) {
      tableData = entry.publish_details.map(async (data: any, index: number) => {
        itemStatusMap[index] = 'loaded';
        let name = await getEnvironmentName(data, config);
        let matchingLocale = locales.find((item: any) => item.code === data.locale);
        let icon;
        if (matchingLocale && matchingLocale.localized) {
          icon = <Icon icon='SuccessInverted' />;
        }
        return {
          index: index,
          env: name,
          language: data.locale,
          loc: icon
        };

      })
    }
    tableData = await Promise.all(tableData);
    console.log(tableData)
    return tableData;
  }

  async function getEnvironmentName(environment: any, config: any) {
    var request = {
      method: 'GET',
      url: 'https://api.contentstack.io/v3/environments',
      headers: {
        'api_key': config.apiKey,
        'authorization': config.accessToken,
        'Content-Type': 'application/json',
      }
    };

    const response = await axios(request)
    for (let i = 0; i < response.data.environments.length; i++) {
      let env = response.data.environments[i];
      if (env.uid === environment.environment) {
        return env.name;
      }
    }
  }

  const columns = [
    {
      Header: 'Language',
      id: 'language',
      accessor: "language",
    },
    {
      Header: 'Environment',
      id: "env",
      accessor: "env",
    },
    {
      Header: 'Localized',
      id: "loc",
      accessor: "loc",
    }
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

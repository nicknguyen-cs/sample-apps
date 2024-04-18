import { useEffect, useState } from "react";
import Extension from "@contentstack/app-sdk/dist/src/extension";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { EntryReferenceDetails, HelpText, Icon } from "@contentstack/venus-components";
import '@contentstack/venus-components/build/main.css';
import React from "react";
import Tree from 'react-d3-tree';

interface DataItem {
  entry_uid: string;
  content_type_uid: string;
  locale: string;
  title: string;
  content_type_title: string;
  height: number;
}

interface TreeNode {
  name: string;
  children: TreeNode[];
}

const EntrySidebarExtension = () => {
  const [appSDK, setAppSDK] = useState<Extension | null>(null);
  const [allReferences, setAllReferences] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);

  const tree = (data: any) => {
    return (
      <div id="treeWrapper" style={{ width: '150em', height: '400em' }}>
        <Tree data={data} pathFunc={"step"} orientation={"vertical"} />
      </div>
    );
  }

  // Initialize Contentstack SDK and fetch references on component mount
  useEffect(() => {
    ContentstackAppSDK.init()
      .then(async sdk => {
        setAppSDK(sdk);
        const sidebarWidget = sdk.location?.SidebarWidget;
        const fieldData = await sidebarWidget?.entry.getData();
        const contentTypeUID = (await sidebarWidget?.entry.content_type).uid;
        let references = await fetchAllReferences(fieldData.uid, contentTypeUID, sdk);
        createHierarchy(references)
        console.log(references);
        setTreeData(references)
      })
      .catch((error: any) => { });

  }, []);

  async function fetchAllReferences(entryUid: any, contentTypeUid: any, sdk: Extension, height = 0, isRootCall = true, visited: Set<any> = new Set()) {
    if (visited.has(entryUid)) {
      // Already visited this entry; return to avoid infinite recursion
      return [];
    }

    visited.add(entryUid);

    const res = await sdk.stack.ContentType(contentTypeUid).Entry(entryUid).getReferences();
    const references = res.references || [];

    if (!Array.isArray(references) || references.length === 0) return [];
    // Add depth to each reference
    references.forEach((ref: any) => ref.height = height);

    let allRefs = [...references];
    for (let reference of references) {
      const childRefs = await fetchAllReferences(reference.entry_uid, reference.content_type_uid, sdk, height + 1, false, visited);
      allRefs = [...allRefs, ...childRefs];
    }

    // If this is the root call (i.e., the initial call), filter duplicates. Otherwise, just return all references.
    if (isRootCall) {
      allRefs = filterDuplicatesByDepth(allRefs);
    }
    return allRefs;
  }


  function filterDuplicatesByDepth(references: any[]) {
    const uniqueRefs = Array.from(new Set(references.map((ref: any) => ref.entry_uid)))
      .map(entry_uid => {
        const duplicates = references.filter(ref => ref.entry_uid === entry_uid);
        return duplicates.sort((a, b) => a.height - b.height)[0];
      });

    return uniqueRefs;
  }


  // Fetch references for the current entry
  async function fetchReferences(sdk: Extension) {
    const sidebarWidget = sdk.location?.SidebarWidget;
    const fieldData = await sidebarWidget?.entry.getData();
    const contentTypeUID = (await sidebarWidget?.entry.content_type).uid;
    const refs = await fetchAllReferences(fieldData.uid, contentTypeUID, sdk);
    return refs;
  }

  function createHierarchy(data: DataItem[]): TreeNode[] {
    const nodesByHeight: Map<number, TreeNode[]> = new Map();
    let maxDepth = 0;

    // Create nodes for each item and group them by height
    data.forEach(item => {
      const node: TreeNode = { name: item.title, children: [] };
      const height = item.height;
      maxDepth = Math.max(maxDepth, height);

      if (!nodesByHeight.has(height)) {
        nodesByHeight.set(height, []);
      }

      nodesByHeight.get(height)?.push(node);
    });

    // Link children to their parents
    for (let i = 0; i < maxDepth; i++) {
      const children = nodesByHeight.get(i) || [];
      const parents = nodesByHeight.get(i + 1) || [];

      children.forEach(child => {
        // For simplicity, attaching each child to the first parent at the next height
        if (parents.length > 0) {
          parents[0].children.push(child);
        }
      });
    }

    // The root nodes are those with the maximum depth
    return nodesByHeight.get(maxDepth) || [];
  }



  return (
    <div className="entry-sidebar-container">
      <div className="entry-sidebar-icon">
        <Icon icon="Reference" size="large" />
      </div>
      <HelpText>
        <i>The following list are connected to this entry.</i>
      </HelpText>
      <hr />
    </div>
  );
}

export default EntrySidebarExtension;
import { useEffect, useState } from "react";
import Extension from "@contentstack/app-sdk/dist/src/extension";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { EntryReferenceDetails, HelpText, Icon } from "@contentstack/venus-components";
import '@contentstack/venus-components/build/main.css';
import React from "react";

const EntrySidebarExtension = () => {
  const [appSDK, setAppSDK] = useState<Extension | null>(null);
  const [allReferences, setAllReferences] = useState<any[]>([]);

  // Initialize Contentstack SDK and fetch references on component mount
  useEffect(() => {
    ContentstackAppSDK.init()
      .then(async sdk => {
        setAppSDK(sdk);
        fetchReferences(sdk);
      })
      .catch((error: any) => {});

  }, []);

  async function fetchAllReferences(entryUid: any, contentTypeUid: any, sdk: Extension, depth = 0, isRootCall = true, visited: Set<any> = new Set()) {
    if (visited.has(entryUid)) {
      // Already visited this entry; return to avoid infinite recursion
      return [];
    }

    visited.add(entryUid);

    const res = await sdk.stack.ContentType(contentTypeUid).Entry(entryUid).getReferences();
    const references = res.references || [];

    if (!Array.isArray(references) || references.length === 0) return [];
    // Add depth to each reference
    references.forEach((ref: any) => ref.depth = depth);

    let allRefs = [...references];
    for (let reference of references) {
      const childRefs = await fetchAllReferences(reference.entry_uid, reference.content_type_uid, sdk, depth + 1, false, visited);
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
        return duplicates.sort((a, b) => a.depth - b.depth)[0];
      });

    return uniqueRefs;
  }


  // Fetch references for the current entry
  async function fetchReferences(sdk: Extension) {
    const sidebarWidget = sdk.location?.SidebarWidget;
    const fieldData = await sidebarWidget?.entry.getData();
    const contentTypeUID = (await sidebarWidget?.entry.content_type).uid;
    const refs = await fetchAllReferences(fieldData.uid, contentTypeUID, sdk);
    setAllReferences(refs);
  }

  // Component to display each reference
  const VariationRow = () => (
    <div>
      {allReferences.map((reference, index) => (
        <React.Fragment key={index}>
          {(index === 0 || allReferences[index - 1].depth !== reference.depth) && (
            <div style={{ display: "flex", alignItems: "center" }}>
              <h3 style={{ padding: "5px", margin: 0 }}>{reference.depth + 1} levels</h3>
              <hr style={{ flexGrow: 1, height: "1px", backgroundColor: "black", border: "none", margin: 0 }} />
            </div>
          )}
          <a
            style={{ textAlign: "left" }}
            href={`https://app.contentstack.com/#!/stack/blt8f285fdea6372037/content-type/${reference.content_type_uid}/en-us/entry/${reference.entry_uid}/edit?branch=main`}
            target="_blank"
            rel="noreferrer"
          >
            <EntryReferenceDetails
              contentType={reference.content_type_title}
              title={reference.title}
            />
          </a>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="entry-sidebar-container">
      <div className="entry-sidebar-icon">
        <Icon icon="Reference" size="large" />
      </div>
      <HelpText>
        <i>The following list are connected to this entry.</i>
      </HelpText>
      <hr />
      {VariationRow()}
    </div>
  );
}

export default EntrySidebarExtension;
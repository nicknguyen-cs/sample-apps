import React, { useEffect } from "react"
import { FieldLabel, HelpText, MiniScrollableTable, Button, TextInput, Tooltip, Icon, EntryReferenceDetails } from "@contentstack/venus-components"

const MiniTable = (props: any) => {
    const TableHeader = () => (<>
        <div className="flex-v-center">
            <FieldLabel htmlFor="Name" className="ml-20">
                Name
            </FieldLabel>
        </div>
    </>)

    const VariationRows = () => {
        const processedUids = new Set<string>();
        let elements = traverseNode(props.references, processedUids);
        return (
            <>
                {elements}
            </>)
    }

    function traverseNode(node: any, processedUids : Set<String>): any {
        let elements: any = [];
        // Process the current node
        if (processedUids.has(node.entry.uid)) {
            return elements; // return empty array if node is already processed
        }
        if (node.entry && node.entry.title) {
            elements.push(
                <div className="flex-v-center mb-20">
                    <EntryReferenceDetails
                        contentType={node._content_type_uid}
                        title={node.entry.title}
                    />
                </div>
            );
        }
        processedUids.add(node.entry.uid);

        // If the node has neighbors, traverse them
        if (node.neighbors && node.neighbors.length > 0) {
            for (const neighbor of node.neighbors) {
                elements.push(...traverseNode(neighbor, processedUids));
            }
        }
        return elements;
    }

    return (
        <>
            <FieldLabel htmlFor="stack-permissions">
                References
            </FieldLabel>
            <HelpText>
                <i>
                    List of all references that will be cloned
                </i>
            </HelpText>
            <MiniScrollableTable
                headerComponent={<TableHeader />}
                maxContentHeight="250px"
                rowComponent={<VariationRows />}
                testId="cs-mini-scrollable-table"
                type="Primary"
                width="300px"
            />
            <Button
                buttonType="tertiary"
                className="ml-10 mt-10 mb-10"
                icon="AddPlus"
            >
                Add Variation
            </Button>
        </>
    )
}




export default MiniTable;


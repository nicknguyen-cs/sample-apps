import React, { useState } from "react"
import { ModalFooter, ModalBody, ModalHeader, ButtonGroup, Button, FieldLabel, MiniScrollableTable, TextInput, Icon, Checkbox, Info } from "@contentstack/venus-components"
import './CloneModal.css';
import { EntryNode, MiniTableDataType, ModalProps } from "../../types/cloneTypes";
import { cloneEntry, getParentNode } from "../../services/clone/services";

const CloneModal: React.FC<ModalProps> = ({ appSDK, contentTypeUID, modalProps }) => {

    let [isLoading, setIsLoading] = useState<boolean>(false);
    let [isCloned, setIsCloned] = useState<boolean>(false);
    let [hasError, setHasError] = useState<boolean>(false);
    let [errorMessage, setErrorMessage] = useState<string>('');
    let [isCloningLocales, setIsCloningLocales] = useState<boolean>(false);
    let [isCurrentEntryOnly, setIsCurrentEntryOnly] = useState<boolean>(false);
    let [miniTableData, setMiniTableData] = useState<MiniTableDataType[]>([]);

    const processMiniTableData = (languages: string[], node: EntryNode) => {
        setMiniTableData(prevSummary => [...prevSummary, {
            contentType: node.contentTypeUid,
            title: node.entry.title,
            uid: node.entry.uid,
            locales: languages
        }]);
    }

    async function clone() {
        setIsLoading(true);
        let referenceUidMapping = new Map<string, EntryNode>();
        let parentNode = await getParentNode(appSDK, isCurrentEntryOnly, contentTypeUID);
        try {
            console.log(parentNode);
            await cloneEntry(appSDK, parentNode, isCloningLocales, referenceUidMapping, processMiniTableData);
        } catch (e: any) {
            setHasError(true);
            setErrorMessage(e.message);
        }
        //setIsCloned(true);
        setIsLoading(false);
    }

    return (
        <>
            <ModalHeader title={"Entry Cloning"} closeModal={modalProps.closeModal} />
            <ModalBody>
                <div>
                    <h2 style={{ paddingBottom: 10 }}> Settings </h2>
                    <Checkbox
                        checked={isCloningLocales}
                        label="All Languages"
                        onClick={() => { setIsCloningLocales(!isCloningLocales) }}
                    />
                    <br />
                    <Checkbox
                        checked={isCurrentEntryOnly}
                        label="No References"
                        onClick={() => { setIsCurrentEntryOnly(!isCurrentEntryOnly) }}
                    />
                </div>
                <br />
                <div style={{marginTop:10}}>
                    <h2>
                        Cloned Items
                    </h2>
                    <MiniScrollableTable
                        headerComponent={<>
                            <div className="flex-v-center">
                                <FieldLabel htmlFor="ContentType" version="v2">
                                    Success
                                </FieldLabel>
                            </div>
                            <div className="flex-v-center" style={{ marginLeft: 20 }}>
                                <FieldLabel htmlFor="ContentType">
                                    Content Type
                                </FieldLabel>
                            </div>
                            <div style={{ marginLeft: 20 }}>
                                <FieldLabel htmlFor="Title" >
                                    Title
                                </FieldLabel>
                            </div>
                            <div style={{ marginLeft: 360 }}>
                                <FieldLabel htmlFor="Locales" >
                                    Locales
                                </FieldLabel>
                            </div>
                        </>}
                        maxContentHeight="250px"
                        rowComponent={miniTableData.map((item, index) => (
                            <div key={index} className="flex-v-center mb-20">
                                <div key={index} className="flex-v-center mb-20">
                                    <div style={{ "width": "90px" }}>
                                        <Icon icon='SuccessInverted' width="small" />
                                    </div>
                                    <TextInput value={item.contentType} width="small" disabled />
                                    <TextInput value={item.title} width="large" disabled />
                                    <TextInput value={item.locales.length === 0 ? " " : item.locales} width="small" maxLength={15} disabled />
                                </div>
                            </div>
                        ))}
                        testId="cs-mini-scrollable-table"
                        type="Primary"
                        width="auto"
                    />
                    <Button icon="PublishWhite" onClick={clone} isLoading={isLoading} disabled={isCloned}>
                        Start Clone
                    </Button>
                    {hasError && <Info
                        content={errorMessage}
                        dismissable
                        icon={<Icon icon="Error" />}
                        type="warning"
                        width={600}
                        style={{ marginTop: 20 }}
                    />}
                </div>
            </ModalBody>
            <ModalFooter>
                <ButtonGroup>
                    <Button onClick={modalProps.closeModal} buttonType="light">
                        Cancel
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </>
    )
}

export default CloneModal;

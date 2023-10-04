import React from "react"
import { ModalFooter, ModalBody, ModalHeader, ButtonGroup, Button, Paragraph } from "@contentstack/venus-components"

const SelectModal = (props: any) => {
    return (
        <>
            <ModalHeader title={"Select Asset"} closeModal={props.closeModal} />
            <ModalBody className="modalBodyCustomClass">
                <div className="dummy-body">
                    <p>Are you sure you want to clone these entries? The action in non-reversable</p>
                    <p>Processing {props.counter} of 7</p>                   
                </div>
            </ModalBody>
            <ModalFooter>
                <ButtonGroup>
                    <Button onClick={props.closeModal} buttonType="light">
                        Cancel
                    </Button>
                    <Button onClick={props.clone} icon="SaveWhite" >
                        Clone
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </>
    )
}

export default SelectModal;

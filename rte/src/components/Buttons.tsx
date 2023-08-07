import { ActionTooltip, Button, ButtonGroup, Icon, cbModal } from "@contentstack/venus-components";
import EmbedModal from "./EmbedModal";
import React from "react";
import DeleteModal from "./DeleteModal";

const Buttons = (props: any) => {
    const { attributes, attrs, children } = props;
    console.log("Props: " , props.rte.selection.get());
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
    const match = attrs.url.match(youtubeRegex);
    const url = `https://www.youtube.com/embed/${match[1]}`;
    const savedSelection = props.rte.selection.get();
    const rte = props.rte;
    console.log("After: " , rte);   
    const openModal = () => {
        cbModal({
            component: (props: any) => (
                <EmbedModal savedSelection={savedSelection} rte={rte} update={true} attrs={attrs} {...props} />
            ),
            modalProps: {
                shouldReturnFocusAfterClose: false,
            },
        });
    }

    const deleteModal = () => {
        cbModal({
            component: (props: any) => (
                <DeleteModal savedSelection={savedSelection} rte={rte} {...props} />
            ),
            modalProps: {
                shouldReturnFocusAfterClose: false,
            },
        });
    }


    return (
            <ButtonGroup>
                <Button buttonType="secondary" onClick={openModal}></Button>
                <Button buttonType="delete" onClick={deleteModal}></Button>
            </ButtonGroup>
    );

}

export default Buttons;
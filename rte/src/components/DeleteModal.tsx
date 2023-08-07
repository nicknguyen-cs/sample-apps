import React, { useState, Fragment } from "react";
import {
  Field,
  TextInput,
  Button,
  ButtonGroup,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from "@contentstack/venus-components";

const SocialEmbedModal = (props: any) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const { rte, update, savedSelection , attrs} = props;
  const handleSubmit = (e: any) => {
    e.preventDefault();

      rte.deleteNode(
        {
          at: savedSelection,
        }
      );
   
    props.closeModal();
  };

  return (
    <Fragment>
      <ModalHeader
        title={'Embed'}
        closeModal={props.closeModal}
      />
      <ModalBody>
        <form onSubmit={handleSubmit}>
            <p>Are you sure you want to remove this embed?</p>
        </form>
      </ModalBody>
      <ModalFooter>
        <ButtonGroup>
          <Button key="cancel" buttonType="light" onClick={props.closeModal}>
            Cancel
          </Button>
          <Button key="add" icon="CheckedWhite" onClick={handleSubmit}>
            Remove
          </Button>
        </ButtonGroup>
      </ModalFooter>
    </Fragment>
  );
};

export default SocialEmbedModal;
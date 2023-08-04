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
  const { rte, update, savedSelection } = props;
  const handleSubmit = (e: any) => {
    e.preventDefault();
    //* Insert social-embed node with the url
    console.log("Modal: ", savedSelection);
    if (!update) {
      rte.insertNode(
        {
          type: "embed",
          attrs: {
            url,
            title,
            width,
            height
          },
          children: [{ text: "" }],
        },
        {
          at: savedSelection,
        }
      );
    } else {
      rte.updateNode(
        {
          type: "embed",
          attrs: {
            url,
            title,
            width,
            height
          },
          children: [{ text: "" }],
        },
        {
          at: savedSelection,
        }
      )
    }
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
          <Field labelText="Embed URL">
            <TextInput
              autoFocus
              name="embeded_url"
              placeholder="Enter Embeded url"
              type="url"
              value={url ? "" : url}
              onChange={(e: any) => setUrl(e.target.value)}
            />
          </Field>
          <Field labelText="Title">
            <TextInput
              autoFocus
              name="embeded_title"
              placeholder="Enter Title"
              type="text"
              value={title ? "" : title}
              onChange={(e: any) => setTitle(e.target.value)}
            />
          </Field>
          <Field labelText="Width">
            <TextInput
              autoFocus
              name="embeded_width"
              placeholder="Enter Video Width"
              type="number"
              value={width ? "" : width}
              onChange={(e: any) => setWidth(e.target.value)}
            />
          </Field>
          <Field labelText="Height">
            <TextInput
              autoFocus
              name="embeded_height"
              placeholder="Enter Video Height"
              type="number"
              value={height ? "" : height}
              onChange={(e: any) => setHeight(e.target.value)}
            />
          </Field>
        </form>
      </ModalBody>
      <ModalFooter>
        <ButtonGroup>
          <Button key="cancel" buttonType="light" onClick={props.closeModal}>
            Cancel
          </Button>
          <Button key="add" icon="CheckedWhite" onClick={handleSubmit}>
            Add
          </Button>
        </ButtonGroup>
      </ModalFooter>
    </Fragment>
  );
};

export default SocialEmbedModal;
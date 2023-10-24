import Icon from '../images/sidebarwidget.svg';
import { useEffect, useRef } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { Button, ButtonGroup, cbModal, ModalBody, ModalFooter, ModalHeader } from "@contentstack/venus-components";
import "@contentstack/venus-components/build/main.css";

declare global {
  interface Window {
    iframeRef: any,
    postRobot: any;
  }
}

function EntrySidebarExtension() {

  const ref = useRef(null);

  useEffect(() => {
    ContentstackAppSDK.init().then((sdk) => {
      // The snapshot of referenced DOM Element will render in-place of custom field when modal is opened
      const iframeWrapperRef = ref.current
      // or
      // const iframeWrapperRef = document.getElementById('root')
      window.iframeRef = iframeWrapperRef;

      window.postRobot = sdk.postRobot
      sdk?.location?.CustomField?.frame.updateHeight(500)
      //console.log(sdk);
    })
  }, []);

  const ModalComponent = (props: any) => {
    return (
      <div>
        <ModalHeader title='Modal header' closeModal={props.closeModal} />

        <ModalBody className='modalBodyCustomClass'>
          <h3>Hello from modal</h3> <br />
          <p>Here is an example of a Custom Field Modal Window running off the same App.</p>
        </ModalBody>

        <ModalFooter>
          <ButtonGroup>
            <Button buttonType='light' onClick={() => props.closeModal()}>
              Cancel
            </Button>
            <Button>Send</Button>
          </ButtonGroup>
        </ModalFooter>
      </div>
    )
  }

  const onClose = () => {
    console.log('on modal close')
  }

  const handleClick = () => {
    cbModal({
      component: (props: any) => <ModalComponent {...props} />,
      modalProps: {
        onClose,
        onOpen: () => {
          console.log('onOpen gets called')
        },
      },
      testId: 'cs-modal-storybook',
    })
  }

  return (
    <div ref={ref} className="extension-wrapper">
      <div className='entry-sidebar'>
        <div className='entry-sidebar-container'>
          This is a custom field <hr />
          <Button id='modal-stories' buttonType='outline' onClick={handleClick}>
            <span>Open Modal</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EntrySidebarExtension;

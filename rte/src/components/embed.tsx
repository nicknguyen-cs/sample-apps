import React from 'react';
import { ActionTooltip, Icon, Tooltip, cbModal } from '@contentstack/venus-components';
import EmbedModal from './EmbedModal';
import DeleteModal from './DeleteModal';
import Buttons from './Buttons';

const Embed = (props: any) => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
    const match = props.attrs.url.match(youtubeRegex);
    const url = `https://www.youtube.com/embed/${match[1]}`;
    return (
        <>
            <Tooltip
                content={<Buttons attrs={props.attrs} attributes={props.attributes} {...props} />}
                position="top-start"
                showArrow={true}
                variantType="light"
                type="secondary"
                style={{ width:"100%" }}
            ><iframe
                    style={{ width: '100%', height: '250px' }}
                    contentEditable={false}
                    src={url}
                    allowFullScreen={true}
                    frameBorder={0}
                />
            </Tooltip>
            {props.children}
        </>
    );
};


export default Embed;

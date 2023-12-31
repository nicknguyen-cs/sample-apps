import React from 'react';
import { ActionTooltip, Icon, cbModal } from '@contentstack/venus-components';
import EmbedModal from './EmbedModal';
import DeleteModal from './DeleteModal';

const Embed = (props: any) => {
    const { attributes, attrs, children } = props;
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
    const match = attrs.url.match(youtubeRegex);
    const url = `https://www.youtube.com/embed/${match[1]}`;
    const savedSelection = props.rte.selection.get();
    const rte = props.rte;
    console.log("Hello");
    return (
        <div {...attributes} style={{ width: '100%', 'z-index': "1000", 'position':'absolute' }}>
            <ActionTooltip
                className=""
                list={[
                    {
                        action: () => {
                            cbModal({
                                component: (props: any) => (
                                    <EmbedModal savedSelection={savedSelection} rte={rte} update={true} attrs={attrs} {...props} />
                                )
                            });
                        },
                        label: <Icon icon="EditTransparent" size="mini" />,
                        title: 'Update',
                    },
                    {
                        action: () => {
                            cbModal({
                                component: (props: any) => (
                                    <DeleteModal savedSelection={savedSelection} rte={rte} update={true} {...props} />
                                )
                            });
                        },
                        label: <Icon icon="Trash" size="mini" />,
                        title: 'Delete',
                    },
                    {
                        action: () => {
                            cbModal({
                                component: (props: any) => (
                                    <DeleteModal savedSelection={savedSelection} rte={rte} update={true} {...props} />
                                )
                            });
                        },
                        label: <Icon icon="Trash" size="mini" />,
                        title: 'Delete',
                    },
                    
                ]}
                right="0"
            >
                <iframe
                    style={{ width: '100%', height: '250px' }}
                    contentEditable={false}
                    src={url}
                    allowFullScreen={true}
                    frameBorder={0}
                />
            </ActionTooltip>
            {children}
        </div>
    );
};

export default Embed;

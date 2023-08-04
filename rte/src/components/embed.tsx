import React from 'react';
import { ActionTooltip, Icon, cbModal } from '@contentstack/venus-components';
import EmbedModal from './EmbedModal';

const SocialEmbed = (props: any) => {
    const { attributes, attrs, children } = props;
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
    const match = attrs.url.match(youtubeRegex);
    const url = `https://www.youtube.com/embed/${match[1]}`;
    const savedSelection = props.rte.selection.get();
    const rte = props.rte;
    return (
        <div {...attributes} style={{ width: '100%' }}>
            <ActionTooltip
                className=""
                list={[
                    {
                        action: () => {
                            cbModal({
                                component: (props: any) => (
                                    <EmbedModal savedSelection={savedSelection} rte={rte} update={true} {...props} />
                                ),
                                modalProps: {
                                    shouldReturnFocusAfterClose: false,
                                },
                            });
                        },
                        label: <Icon icon="Update" size="mini" />,
                        title: 'Update',
                    },
                ]}
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

export default SocialEmbed;

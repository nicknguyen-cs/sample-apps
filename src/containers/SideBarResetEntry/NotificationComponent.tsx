
import { Icon, Info, Notification } from '@contentstack/venus-components';
import React from 'react';

const NotificationComponent: React.FC<any> = (props: any) => {

    const { success } = props;
    const content = () => {
        if (success)
            return (
                <Info
                content={"Successfully reset the entry, please refresh the page to see the reflected changes."}
                dismissable
                icon={<Icon icon="InfoCircleWhite" />}
                type="success"
            />)
        else
        return (
            <Info
            content={"There was an error resetting this entry."}
            dismissable
            icon={<Icon icon="InfoCircleWhite" />}
            type="warning"
        />)
    }
    
    return content();
}

export default NotificationComponent;
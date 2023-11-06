export interface Request {
    id: number;
    status: 'loading' | 'completed';
}

export interface AppSDK {
    location?: {
        SidebarWidget?: any;
    };
    getConfig?: () => Promise<any>;
    stack?: any;
}

export class EntryNode {
    entry: any;
    neighbors: EntryNode[] = []; // keep track of all children references
    visited: boolean = false; // for traversing
    inStack: boolean = false; // for cycle detection
    cloned: boolean = false; // for cloning
    _content_type_uid: any; // used for entry creation
}

export interface ModalProps {
    appSDK: AppSDK | null;
    contentTypeUID: string;
    modalProps: any;
    config: any;
}

export interface Settings {
    includeDeepClone: boolean;
    includeAllLanguages: boolean;
    includeAllReferences: boolean;
}
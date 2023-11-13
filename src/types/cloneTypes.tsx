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
    contentTypeUid: string = ""; // used for entry creation
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

// Define the type for miniTableData somewhere in your types file
export interface MiniTableDataType {
    contentType: string;
    title: string;
    uid: string;
    locales: string[];
};

export interface Reference {
    _content_type_uid: string;
    uid: string;
}
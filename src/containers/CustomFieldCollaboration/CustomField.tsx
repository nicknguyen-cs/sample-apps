import "@contentstack/venus-components/build/main.css";
import "./CustomField.css";
import { useEffect, useRef, useState } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import debounce from "lodash.debounce";
import lodash from "lodash";

// Global types for window extensions
declare global {
  interface Window {
    iframeRef: any;
    postRobot: any;
    queryParams: any;
  }
}

// Define the structure for changes sent over the socket
interface ChangePayload {
  [fieldUid: string]: {
    value: any
  };
}

const SOCKET_URL = "https://0ca8-2600-1700-89c4-2e10-a1b8-b62f-4ca3-f3a7.ngrok-free.app";

function CustomFieldCollaboration() {
  // React state for UI
  const [currentData, setCurrentData] = useState<any>({});
  const [user, setUser] = useState<any>({});
  const [sdk, setSdk] = useState<any>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const previousEntryRef = useRef<any>({}); // Replace useState with useRef

  // Socket and collaboration refs
  const socketRef = useRef<any>(null);
  const pendingChangesRef = useRef<Record<string, any>>({});
  const suppressNextChangeForFields = useRef<Set<string>>(new Set());
  const activelyEditingFields = useRef<Set<string>>(new Set());
  const skipInitialLoad = useRef(true); // Flag to skip emitting changes on initial load

  useEffect(() => {
    initializeSDK();
  }, []);

  useEffect(() => {
    if (user?.uid && currentData?.uid) {
      setupSocket();
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user.uid, currentData.uid]);

  const initializeSDK = async () => {
    const appSDK = await ContentstackAppSDK.init();
    const customField = appSDK.location?.CustomField;

    if (!customField) {
      console.warn("🚫 Not running in a Custom Field location.");
      return;
    }

    setUser({
      uid: appSDK.currentUser.uid,
      name: `${appSDK.currentUser.first_name} ${appSDK.currentUser.last_name}`,
    });

    const customFieldData = customField.entry.getData();
    customField.frame.updateHeight(100);

    setCurrentData(customFieldData);
    previousEntryRef.current = { ...customFieldData }; // Update the ref directly
    setSdk(customField);

    setupFieldChangeListener(customField);
    skipInitialLoad.current = false; // Reset the flag after initial load
  };

  const setupFieldChangeListener = (customField: any) => {
    customField.entry.onChange((updatedEntryPayload: {}) => {
      handleFieldChanges(updatedEntryPayload, customField.entry.getData().uid);
    });
  };

  const handleFieldChanges = (updatedEntryPayload: any, entryUid: string) => {
    console.log("PREV: ", previousEntryRef.current);
    if (skipInitialLoad.current) return; // Skip emitting changes during initial load
    if (Object.keys(previousEntryRef.current).length === 0) return; // Check if previousEntry is empty

    for (const field in updatedEntryPayload) {
      if (suppressNextChangeForFields.current.has(field)) {
        suppressNextChangeForFields.current.delete(field);
        continue;
      }

      if (!lodash.isEqual(previousEntryRef.current[field], updatedEntryPayload[field])) {
        activelyEditingFields.current.add(field);
        releaseEditingLock();

        previousEntryRef.current[field] = updatedEntryPayload[field];
        pendingChangesRef.current[field] = updatedEntryPayload[field];
        emitChanges(entryUid);
        break;
      }
    }
  };

  const emitChanges = debounce((entryUid : string) => {
    const changesToEmit: ChangePayload = {};

    Object.entries(pendingChangesRef.current).forEach(([field, value]) => {
      changesToEmit[field] = value;
    });

    pendingChangesRef.current = {};

    if (Object.keys(changesToEmit).length > 0) {
      socketRef.current?.emit("entryUpdated", {
        entryId: entryUid,
        changes: changesToEmit,
      });
    }
  }, 200);

  const releaseEditingLock = debounce(() => {
    activelyEditingFields.current.clear();
  }, 1000);

  const setupSocket = () => {
    socketRef.current = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      handleSocketConnect(user, currentData);
    });
    socketRef.current.on("entryUpdated", handleSocketEntryUpdate);
    socketRef.current.on("updateUsers", setConnectedUsers);
    socketRef.current.on("disconnect", () => setIsConnected(false));
  };

  const handleSocketConnect = (currentUser: { uid: string; name: string }, currentEntry: { uid: string }) => {
    if (!currentUser?.uid || !currentEntry?.uid) return;

    socketRef.current?.emit("join", {
      entryId: currentEntry.uid,
      username: currentUser.name || "Anonymous",
      clientId: currentUser.uid,
    });

    setIsConnected(true);
  };

  const handleSocketEntryUpdate = ({ changes }: { changes: Record<string, any> }) => {
    const validChanges: Record<string, any> = {};
    Object.entries(changes).forEach(([fieldUid, value]) => {
      // Skip applying if user is actively editing
      if (activelyEditingFields.current.has(fieldUid)) return;

      validChanges[fieldUid] = value;
    });

    if (Object.keys(validChanges).length > 0) {
      applyFieldChanges(validChanges);
    }
  };

  const applyFieldChanges = (validChanges: Record<string, any>) => {
    Object.entries(validChanges).forEach(([fieldUid, value]) => {
      suppressNextChangeForFields.current.add(fieldUid);
      sdk.entry.getField(fieldUid).setData(value);
    });

    setCurrentData((prev: any) => ({
      ...prev,
      ...validChanges,
    }));
  };

  // Basic collaboration UI for status and connected users
  return (
    <div className="custom-field-collaboration">
      <ConnectionStatus isConnected={isConnected} />
      <ConnectedUsers users={connectedUsers} />
    </div>
  );
}

const ConnectionStatus = ({ isConnected }: { isConnected: boolean }) => (
  <div className="connection-status">{isConnected ? "🟢 Connected" : "🔴 Connecting..."}</div>
);

const ConnectedUsers = ({ users }: { users: string[] }) => (
  <div className="connected-users">
    {users.length > 0 ? (
      <div className="user-avatars">
        {users.map((user, index) => (
          <span key={index} className="user-avatar" title={user}>
            {user.charAt(0).toUpperCase()}
          </span>
        ))}
      </div>
    ) : (
      <p className="no-users">No users connected</p>
    )}
  </div>
);

export default CustomFieldCollaboration;

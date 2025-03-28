import "@contentstack/venus-components/build/main.css";
import "./CustomField.css";
import { useEffect, useRef, useState } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import debounce from "lodash.debounce";
import lodash from "lodash";

declare global {
  interface Window {
    iframeRef: any;
    postRobot: any;
    queryParams: any;
  }
}

interface ChangePayload {
  [fieldUid: string]: {
    value: any;
    timestamp: number;
  };
}

const SOCKET_URL = "https://0ca8-2600-1700-89c4-2e10-a1b8-b62f-4ca3-f3a7.ngrok-free.app";

function CustomFieldCollaboration() {
  const [currentData, setCurrentData] = useState<any>({});
  const [sdk, setSdk] = useState<any>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [previousEntry, setPreviousEntry] = useState<any>({});

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const pendingChangesRef = useRef<Record<string, any>>({});
  const lastUpdatedRef = useRef<Record<string, number>>({});
  const suppressNextChangeForFields = useRef<Set<string>>(new Set());
  const activelyEditingFields = useRef<Set<string>>(new Set());

  const releaseEditingLock = debounce(() => {
    activelyEditingFields.current.clear();
  }, 1000);

  const initContentstackSdk = async () => {
    const appSDK = await ContentstackAppSDK.init();
    const customField = appSDK.location?.CustomField;

    if (!customField) {
      console.warn("🚫 Not running in a Custom Field location.");
      return null;
    }

    const customFieldData = customField.entry.getData();
    customField.frame.updateHeight(100);

    setCurrentData(customFieldData);
    setPreviousEntry(customFieldData);
    setSdk(customField);

    return customField;
  };

  const setupFieldChangeListener = (customField: any) => {
    const emitChanges = debounce(() => {
      const now = Date.now();
      const changesToEmit: ChangePayload = {};

      Object.entries(pendingChangesRef.current).forEach(([field, value]) => {
        changesToEmit[field] = { value, timestamp: now };
        lastUpdatedRef.current[field] = now;
      });

      pendingChangesRef.current = {};

      if (Object.keys(changesToEmit).length > 0) {
        socketRef.current?.emit("entryUpdated", {
          entryId: customField.entry.getData().uid,
          changes: changesToEmit,
        });
      }
    }, 200);

    customField.entry.onChange((updatedEntry: any) => {
      for (const field in updatedEntry) {
        if (suppressNextChangeForFields.current.has(field)) {
          suppressNextChangeForFields.current.delete(field);
          continue;
        }

        if (!lodash.isEqual(previousEntry[field], updatedEntry[field])) {
          activelyEditingFields.current.add(field);
          releaseEditingLock();

          const now = Date.now();
          previousEntry[field] = updatedEntry[field];
          pendingChangesRef.current[field] = updatedEntry[field];
          lastUpdatedRef.current[field] = now;
        }
      }

      emitChanges();
    });
  };

  const setupSocket = () => {
    socketRef.current = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      setIsConnected(true);

      socketRef.current?.emit("join", {
        entryId: currentData.uid,
        username: sdk?.entry?.getData()?.uid || "Anonymous",
        clientId: sdk?.entry?.getData()?.uid,
      });
    });

    socketRef.current.on("entryUpdated", ({ changes }: { changes: ChangePayload }) => {
      const validChanges: Record<string, any> = {};

      Object.entries(changes).forEach(([fieldUid, { value, timestamp }]) => {
        const localTimestamp = lastUpdatedRef.current[fieldUid] || 0;

        if (activelyEditingFields.current.has(fieldUid)) return;

        if (timestamp > localTimestamp) {
          validChanges[fieldUid] = value;
          lastUpdatedRef.current[fieldUid] = timestamp;
        }
      });

      if (Object.keys(validChanges).length > 0) {
        Object.entries(validChanges).forEach(([fieldUid, value]) => {
          suppressNextChangeForFields.current.add(fieldUid);
          sdk.entry.getField(fieldUid).setData(value);
        });

        setCurrentData((prev: any) => ({
          ...prev,
          ...validChanges,
        }));
      }
    });

    socketRef.current.on("updateUsers", (users: string[]) => {
      setConnectedUsers(users);
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
    });
  };

  useEffect(() => {
    const initialize = async () => {
      const sdk = await initContentstackSdk();
      if (!sdk) return;
      setupFieldChangeListener(sdk);
      setupSocket();
    };

    initialize();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentData.uid]);

  return (
    <div className="custom-field-collaboration">
      <div className="connection-status">{isConnected ? "🟢 Connected" : "🔴 Connecting..."}</div>
      <div className="connected-users">
        {connectedUsers.length > 0 ? (
          <div className="user-avatars">
            {connectedUsers.map((user, index) => (
              <span key={index} className="user-avatar" title={user}>
                {user.charAt(0).toUpperCase()}
              </span>
            ))}
          </div>
        ) : (
          <p className="no-users">No users connected</p>
        )}
      </div>
    </div>
  );
}

export default CustomFieldCollaboration;

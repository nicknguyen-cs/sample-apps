import "@contentstack/venus-components/build/main.css";
import "./CustomField.css";
import { useEffect, useState, useRef } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import io from "socket.io-client";
import debounce from "lodash.debounce";
import lodash from "lodash";

interface ChangePayload {
  [fieldUid: string]: {
    value: any;
    timestamp: number;
  };
}

const SOCKET_URL = "https://0ca8-2600-1700-89c4-2e10-a1b8-b62f-4ca3-f3a7.ngrok-free.app";
const EDIT_LOCK_MS = 1500;

function CustomFieldCollaboration() {
  const [sdk, setSdk] = useState<any>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [user, setUser] = useState<any>({});

  const socketRef = useRef<any>(null);
  const lastValues = useRef<Record<string, any>>({});
  const lastUpdated = useRef<Record<string, number>>({});
  const suppressNextChange = useRef<Set<string>>(new Set());
  const localEditTimestamps = useRef<Record<string, number>>({});

  const initContentstackSdk = async () => {
    const appSDK = await ContentstackAppSDK.init();
    const customField = appSDK.location?.CustomField;

    setUser({
      uid: appSDK.currentUser.uid,
      name: `${appSDK.currentUser.first_name} ${appSDK.currentUser.last_name}`,
    });

    if (!customField) {
      console.warn("🚫 Not running in a Custom Field location.");
      return null;
    }

    const data = customField.entry.getData();
    lastValues.current = { ...data };
    customField.frame.updateHeight(100);

    setSdk(customField);
    return customField;
  };

  const setupFieldChangeListener = (customField: any) => {
    const emitChange = debounce((field: string, value: any) => {
      const timestamp = Date.now();
      socketRef.current?.emit("entryUpdated", {
        entryId: customField.entry.getData().uid,
        clientId: user.uid,
        changes: {
          [field]: { value, timestamp },
        },
      });
      lastUpdated.current[field] = timestamp;
    }, 150);

    customField.entry.onChange((entry: any) => {
      const now = Date.now();

      for (const field in entry) {
        if (suppressNextChange.current.has(field)) {
          suppressNextChange.current.delete(field);
          continue;
        }

        if (!lodash.isEqual(entry[field], lastValues.current[field])) {
          lastValues.current[field] = entry[field];
          localEditTimestamps.current[field] = now;
          emitChange(field, entry[field]);
        }
      }
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
        entryId: sdk?.entry?.getData()?.uid,
        username: user.name || "Anonymous",
        clientId: user.uid,
      });
    });

    socketRef.current.on("entryUpdated", ({ changes }: { changes: ChangePayload }) => {
      const now = Date.now();

      console.log("Received changes", changes);
      for (const field in changes) {
        const { value, timestamp } = changes[field];
        const localTime = lastUpdated.current[field] || 0;
        const recentEdit = localEditTimestamps.current[field] || 0;

        if (now - recentEdit < EDIT_LOCK_MS) continue;
        if (timestamp <= localTime) continue;

        suppressNextChange.current.add(field);
        sdk.entry.getField(field).setData(value);
        lastValues.current[field] = value;
        lastUpdated.current[field] = timestamp;
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
    const init = async () => {
      const sdk = await initContentstackSdk();
      if (!sdk) return;
      setupFieldChangeListener(sdk);
      setupSocket();
    };

    init();
    return () => socketRef.current?.disconnect();
  }, []);

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
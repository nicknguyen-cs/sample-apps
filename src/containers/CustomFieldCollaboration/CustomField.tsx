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

  const socketRef = useRef<typeof Socket | null>(null);
  const pendingChangesRef = useRef<Record<string, any>>({});
  const lastUpdatedRef = useRef<Record<string, number>>({});
  const suppressNextChangeForFields = useRef<Set<string>>(new Set());
  const activelyEditingFields = useRef<Set<string>>(new Set());

  const releaseEditingLock = debounce(() => {
    activelyEditingFields.current.clear();
  }, 1000);

  useEffect(() => {
    const initializeSDK = async () => {
      const appSDK = await ContentstackAppSDK.init();
      const customFieldData = appSDK?.location?.CustomField?.entry.getData();
      appSDK?.location?.CustomField?.frame.updateHeight(100);

      setCurrentData(customFieldData);
      setPreviousEntry(customFieldData);
      setSdk(appSDK);

      const handleEmitChanges = debounce(() => {
        const changesToEmit: ChangePayload = {};
        const now = Date.now();

        Object.entries(pendingChangesRef.current).forEach(([field, value]) => {
          changesToEmit[field] = {
            value,
            timestamp: now,
          };
          lastUpdatedRef.current[field] = now;
        });

        pendingChangesRef.current = {};

        if (Object.keys(changesToEmit).length > 0) {
          console.log("📤 Emitting changes:", changesToEmit);
          socketRef.current?.emit("entryUpdated", {
            entryId: sdk.entry?.uid || customFieldData.uid,
            changes: changesToEmit,
          });
        }
      }, 200);

      appSDK?.location?.CustomField?.entry.onChange((updatedEntry: any) => {

        for (const field in updatedEntry) {
          if (suppressNextChangeForFields.current.has(field)) {
            suppressNextChangeForFields.current.delete(field);
            continue;
          }

          activelyEditingFields.current.add(field);
          releaseEditingLock();

          if (!lodash.isEqual(previousEntry[field], updatedEntry[field])) {
            const now = Date.now();
            previousEntry[field] = updatedEntry[field];
            pendingChangesRef.current[field] = updatedEntry[field];
            lastUpdatedRef.current[field] = now;
          }
        }

        handleEmitChanges();
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
          username: sdk?.currentUser?.first_name || "Anonymous",
          clientId: sdk?.currentUser?.uid,
        });
      });

      socketRef.current.on("entryUpdated", ({ changes }: { changes: ChangePayload }) => {

        const validChanges: Record<string, any> = {};

        Object.entries(changes).forEach(([fieldUid, { value, timestamp }]) => {
          const localTimestamp = lastUpdatedRef.current[fieldUid] || 0;

          if (activelyEditingFields.current.has(fieldUid)) {
            return;
          }

          if (timestamp > localTimestamp) {
            console.log(`✅ Applying field ${fieldUid}`);
            validChanges[fieldUid] = value;
            lastUpdatedRef.current[fieldUid] = timestamp;
          } else {
            console.log(`⛔ Skipped stale or duplicate for ${fieldUid}`);
          }
        });

        if (Object.keys(validChanges).length > 0) {
          Object.entries(validChanges).forEach(([fieldUid, value]) => {
            suppressNextChangeForFields.current.add(fieldUid);
            sdk.location.CustomField.entry.getField(fieldUid).setData(value);
          });

          setCurrentData((prev : any) => ({
            ...prev,
            ...validChanges,
          }));
        } else {
          console.log("⚠️ No changes applied from server update.");
        }
      });

      socketRef.current.on("updateUsers", (users: string[]) => {
        setConnectedUsers(users);
      });

      socketRef.current.on("disconnect", () => {
        console.log("❌ Disconnected");
        setIsConnected(false);
      });
    };

    initializeSDK();
    setupSocket();

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
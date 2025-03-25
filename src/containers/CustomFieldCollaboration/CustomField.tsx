import "@contentstack/venus-components/build/main.css";
import "./CustomField.css";
import { useEffect, useRef, useState } from "react";
import { FieldLabel, Field } from "@contentstack/venus-components";
import ContentstackAppSDK from "@contentstack/app-sdk";
import io from "socket.io-client";
import debounce from "lodash.debounce"; // Install lodash.debounce for debouncing
import lodash from "lodash";

declare global {
  interface Window {
    iframeRef: any;
    postRobot: any;
    queryParams: any;
  }
}

const SOCKET_URL = "http://localhost:3001";

function CustomFieldCollaboration() {
  const [currentData, setCurrentData] = useState<any>({});
  const [sdk, setSdk] = useState<any>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [previousEntry, setPreviousEntry] = useState<any>({});
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const pendingChangesRef = useRef<Record<string, any>>({}); // Track pending changes
  const isProcessingRef = useRef(false); // Prevent overlapping processing

  useEffect(() => {
    const initializeSDK = async () => {
      const appSDK = await ContentstackAppSDK.init();
      const customFieldData = appSDK?.location?.CustomField?.entry.getData();
      appSDK?.location?.CustomField?.frame.updateHeight(100);

      setCurrentData(customFieldData);
      setPreviousEntry(customFieldData); // Initialize previousEntry with the current state of the entry
      setSdk(appSDK);

      const handleEntryChange = debounce(() => {
        if (isProcessingRef.current) return; // Prevent overlapping processing
        isProcessingRef.current = true;

        const changedFields = { ...pendingChangesRef.current };
        pendingChangesRef.current = {}; // Clear pending changes after processing

        if (Object.keys(changedFields).length > 0) {

          // Notify other users via WebSocket
          socketRef.current?.emit("entryUpdated", {
            entryId: customFieldData.uid,
            changes: changedFields,
          });

          // Update the previous entry state
          setPreviousEntry((prev: any) => ({
            ...prev,
            ...changedFields,
          }));
        }

        isProcessingRef.current = false;
      }, 500); // Debounce for 300ms

      appSDK?.location?.CustomField?.entry.onChange((updatedEntry: any) => {
        // Compare fields to detect changes and batch them
        pendingChangesRef.current = {};
        for (const field in updatedEntry) {
          if (!lodash.isEqual(previousEntry[field], updatedEntry[field])) {
            previousEntry[field] = updatedEntry[field];
            pendingChangesRef.current[field] = updatedEntry[field];
          }
        }
        handleEntryChange(); // Trigger the debounced function
      });
    };

    initializeSDK();

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
        });
      });

      socketRef.current.on("entryUpdated", (changes: Record<string, any>) => {
        Object.keys(changes).forEach((fieldUid) => {
          sdk.location.CustomField.entry.getField(fieldUid).setData(changes[fieldUid]);
        });

        setCurrentData((prevData: any) => ({
          ...prevData,
          ...changes,
        }));
      });

      socketRef.current.on("updateUsers", (users: string[]) => {
        setConnectedUsers(users);
      });

      socketRef.current.on("disconnect", () => {
        console.log("❌ Disconnected");
        setIsConnected(false);
      });
    };

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

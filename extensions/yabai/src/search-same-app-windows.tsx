import { ActionPanel, Action, List, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { runYabaiCommand } from "./helpers/scripts";
import { execaCommand } from "execa";
import { sortWindows, BaseWindow } from "./helpers/window-utils";

interface Window extends BaseWindow {
  icon?: string;
  display: number;
  "has-focus": boolean;
  "is-minimized": boolean;
}

async function findAppPath(pid: number): Promise<string> {
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new Error("Invalid process ID");
  }
  const { stdout, stderr } = await execaCommand(`/usr/sbin/lsof -p ${pid} | grep txt | grep -v DEL | head -n 1 `, {
    shell: true,
  });
  if (stderr) {
    console.error(stderr);
    return "";
  }
  const beginIndex = stdout.indexOf("/");
  const appIndex = stdout.indexOf(".app");
  if (appIndex === -1) {
    return stdout;
  }
  return stdout.substring(beginIndex, appIndex + 4);
}

export default function Command() {
  const [windows, setWindows] = useState<Window[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentApp, setCurrentApp] = useState<string>("");

  useEffect(() => {
    async function fetchWindows() {
      try {
        const { stdout, stderr } = await runYabaiCommand("-m query --windows");
        if (stderr) {
          throw new Error(stderr);
        }
        const allWindows: Window[] = JSON.parse(stdout);

        const focusedWindow = allWindows.find((w) => w["has-focus"]);
        if (!focusedWindow) {
          showToast(Toast.Style.Failure, "No focused window found");
          setIsLoading(false);
          return;
        }

        setCurrentApp(focusedWindow.app);

        const sameAppWindows = allWindows.filter((w) => w.app === focusedWindow.app);
        const sortedWindows = sortWindows(sameAppWindows);

        const windowsWithIcons = await Promise.all(
          sortedWindows.map(async (window) => ({
            ...window,
            icon: await findAppPath(window.pid),
          })),
        );

        setWindows(windowsWithIcons);
      } catch (error) {
        showToast(Toast.Style.Failure, "Failed to fetch windows");
      } finally {
        setIsLoading(false);
      }
    }

    fetchWindows();
  }, []);

  async function focusWindow(window: Window) {
    try {
      await runYabaiCommand(`-m window --focus ${window.id}`);
      if (window["is-minimized"]) {
        await runYabaiCommand(`-m window ${window.id} --deminimize`);
      }
      showToast(Toast.Style.Success, "Window focused");
    } catch (error) {
      showToast(Toast.Style.Failure, "Failed to focus window");
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder={`Search ${currentApp} windows...`}>
      {windows.map((window) => (
        <List.Item
          key={window.id}
          icon={{ fileIcon: window.icon || window.app }}
          title={window.title || "(No title)"}
          accessories={[
            { text: `Display ${window.display}` },
            { text: `Space ${window.space}` },
            ...(window["has-focus"] ? [{ tag: "Focused" }] : []),
          ]}
          actions={
            <ActionPanel>
              <Action title="Focus Window" onAction={() => focusWindow(window)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

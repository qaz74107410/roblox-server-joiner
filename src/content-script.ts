import { RobloxServerJoiner } from "./roblox-server-joiner"

(async () => {
  const rbServerJoiner = new RobloxServerJoiner()
  rbServerJoiner.onStartSearch = () => {
    rbServerJoiner.UI.joinButton.textContent = ""
    rbServerJoiner.UI.withSpinner(rbServerJoiner.UI.joinButton, "")
    rbServerJoiner.UI.joinButton.disabled = true;
  }
  rbServerJoiner.onEachSearch = (retry: number, maxTry: number) => {
    rbServerJoiner.UI.joinButton.textContent = ""
    rbServerJoiner.UI.withSpinner(rbServerJoiner.UI.joinButton, `Finding ${retry}/${maxTry} ..`)
  }
  rbServerJoiner.onEndSearch = () => rbServerJoiner.UI.restoreJoinButton()
  rbServerJoiner.UI.addCustomJoinButton(async () => await rbServerJoiner.joinWithDialog())
})()
interface RobloxServer {
  PlaceId: string;
  Guid: string;
  CurrentPlayers: any;
}

interface Result {
  foundServer?: RobloxServer
  closeServer?: RobloxServer
}

export class RobloxServerJoiner {

  placeId: string = ""
  title: string = ""
  url: string = ""

  // global roblox object
  Roblox?: any;

  // UI interface for manipulate page
  UI: CustomUI = new CustomUI();

  // listener
  onStartSearch?: () => void 
  onEachSearch?: (retry: number, maxTry: number, prevResult: Result) => void
  onEndSearch?: () => void
  
  constructor() {
    this.title = document.title
    this.placeId = this.getPlaceId(window.location.pathname)
    this.url = window.location.pathname
    this.Roblox = this.getRobloxGlobalObject()
    return this
  }

  // 
  // HELPER
  // 
  
  public joinWithDialog(): Promise<void> {
    return this.joinWithDialogPlaceId(this.placeId);
  }

  public getRobloxGlobalObject(): any {
    console.log(this.Roblox);
    if (this.Roblox) {
      return this.Roblox
    }
    console.log(window);
    console.log((window as any).Roblox)
    const rb = (window as any).Roblox
    if (rb) {
      return rb
    }
  }
  
  public getPlaceId(pathname: string) {
    return pathname.split("/")[2]
  }
  
  public reqRoblox(placeId: string, startIndex: number) {
    startIndex = (startIndex * 10) - 10
    return fetch('https://www.roblox.com/games/getgameinstancesjson?placeId='+placeId+'&startindex='+startIndex+'&_='+Math.round((Math.random() * 10000000)))
  }
  
  private randomInRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // 
  // SCRIPT
  // 
  
  public async findServerWithTargetPlayer(targetPlayerCount: number, placeId: string, maxTry: number): Promise<Result> {
    let minRand = 1
    let res = await this.reqRoblox(placeId, 1);
    let jsonData = await res.json()
    let totalSize = Math.floor(jsonData.TotalCollectionSize / 10)
    let maxRand = totalSize
    let retry = 0
    const result: Result = {
      foundServer: undefined,
      closeServer: undefined,
    }
    while(maxTry > retry) {
      this.onEachSearch && this.onEachSearch(retry, maxTry, result)
      retry++
      const randIndex = this.randomInRange(minRand, maxRand)
      res = await this.reqRoblox(placeId, randIndex)
      jsonData = await res.json()
      const servers = jsonData.Collection
      if (servers.length <= 0) {
        maxRand = randIndex
        continue
      }
      let sumPlayer = 0
      let avgPlayer = 0
      for (const server of servers) {
        const serverPlayerCount = server.CurrentPlayers.length
        const closePlayerCount = result.closeServer ? result.closeServer.CurrentPlayers.length : 9999
        if (serverPlayerCount === targetPlayerCount) {
          result.foundServer = server
          return result
        }
        const distServer = Math.abs(serverPlayerCount - targetPlayerCount)
        const distClose = Math.abs(closePlayerCount - targetPlayerCount)
        if (!result.closeServer || distServer < distClose) {
          result.closeServer = server;
        }
      }
      avgPlayer = Math.round(sumPlayer / servers.length)
      if (avgPlayer > targetPlayerCount) {
        minRand = randIndex
      } else {
        maxRand = randIndex
      }
    }
    return result
  }
  
  public generatePlayButton(server: RobloxServer, id?: string) {
    if (!id) {
      id = "custom-join-1"
    }
    const playButton = document.createElement('button')
    playButton.id = id
    
    const Roblox = this.getRobloxGlobalObject()
    playButton.innerText = 'Play'
    if (!Roblox) {
      try {
        // inject play script due cannot access global object
        playButton.setAttribute('onclick','Roblox.GameLauncher.joinGameInstance('+server.PlaceId+', "'+server.Guid+'")')
      } catch (error) {
        // TODO: handle this
        throw new Error('Roblox is not available')
      }
      return playButton
    }
    playButton.onclick = Roblox.GameLauncher.joinGameInstance(server.PlaceId, server.Guid)
    return playButton
  }
  
  public async joinWithDialogPlaceId(placeId: string) {
    const targetPlayer = Number(prompt("Place enter target player in server"));
    this.onStartSearch && this.onStartSearch()
    const result = await this.findServerWithTargetPlayer(targetPlayer, placeId, 30)
    const foundServer = result.foundServer
    const closeServer = result.closeServer
    
    let server = undefined
  
    if (foundServer) {
      if (confirm(`Found server with ${foundServer.CurrentPlayers.length} player. Join now?`)) {
        server = foundServer
      }
    } else if (closeServer) {
      if (confirm(`Cannot found server with ${targetPlayer}. But nearest found server with ${closeServer.CurrentPlayers.length} player. Join now?`)) {
        server = closeServer
      }
    } else {
      alert('No server found')
    }

    this.onEndSearch && this.onEndSearch()
  
    if (server) {
      const btn = await this.generatePlayButton(server)
      window.document.body.append(btn)
      btn.click()
    }
  }

}

// TODO: this need to be improve
class CustomUI {

  // https://www.roblox.com/reference/styleguide

  spinnerElem: HTMLSpanElement = document.createElement('span')

  defaultContentPlayButton = "Custom Join"

  joinButton: HTMLButtonElement = document.createElement("button")

  constructor() {
    // apply Roblox style
    this.spinnerElem.className = "spinner spinner-sm"
  }

  // generate custom play button
  public addCustomJoinButton(onClickFn: () => void) {
    const gameBtnContainers = document.getElementsByClassName("game-buttons-container")
    const gameBtnContainer = gameBtnContainers.length > 0 ? gameBtnContainers[0] : null
    if (!gameBtnContainer) {
      // TODO: cannot find the game-buttons-container
      return
    }

    // TODO: make prettier ui
    const btnContainer = document.createElement("div")
    btnContainer.className = "game-details-play-button-container"
    this.joinButton.style.marginBottom = "5px"
    this.joinButton.className = "btn-full-width btn-common-play-game btn-secondary-md btn-min-width"
    this.joinButton.textContent = this.defaultContentPlayButton
    this.joinButton.addEventListener("click", onClickFn)

    btnContainer.append(this.joinButton)
    gameBtnContainer.prepend(btnContainer)
  }

  public withSpinner(elem: HTMLElement, text: string): HTMLElement {
    const spinner = this.spinnerElem.cloneNode()
    spinner.textContent = text
    elem.append(spinner)
    return elem
  }

  public restoreJoinButton() {
    this.joinButton.textContent = this.defaultContentPlayButton
    this.joinButton.disabled = false;
  }
}
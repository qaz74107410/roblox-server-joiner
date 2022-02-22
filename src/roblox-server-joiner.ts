import CustomUI from './custom-ui';

interface RobloxServer {
  PlaceId: string;
  Guid: string;
  CurrentPlayers: any;
}

interface Result {
  foundServer?: RobloxServer
  closeServer?: RobloxServer
}

export default class RobloxServerJoiner {
  placeId: string = '';

  title: string = '';

  url: string = '';

  // global roblox object
  Roblox?: any;

  // UI interface for manipulate page
  public UI: CustomUI = new CustomUI();

  // listener
  public onStartSearch?: () => void;

  public onEachSearch?: (retry: number, maxTry: number, prevResult: Result) => void;

  public onEndSearch?: () => void;

  constructor() {
    this.title = document.title;
    this.placeId = RobloxServerJoiner.getPlaceIdFromPathname(window.location.pathname);
    this.url = window.location.pathname;
    this.Roblox = this.getRobloxGlobalObject();
  }

  //
  // HELPER
  //

  public joinWithDialog(): Promise<void> {
    return this.joinWithDialogPlaceId(this.placeId);
  }

  public getRobloxGlobalObject(): any {
    if (this.Roblox) {
      return this.Roblox;
    }
    return (window as any).Roblox;
  }

  static getPlaceIdFromPathname(pathname: string) {
    return pathname.split('/')[2];
  }

  static reqRoblox(placeId: string, startIndex: number) {
    // each api call contains 10 server
    const calStartIndex = ((startIndex + 1) * 10) - 10;
    return fetch(`https://www.roblox.com/games/getgameinstancesjson?placeId=${placeId}&startindex=${calStartIndex}&_=${Math.round((Math.random() * 10000000))}`);
  }

  static randomInRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  //
  // SCRIPT
  //

  public async findServerWithTargetPlayer(
    targetPlayerCount: number,
    placeId: string,
    maxTry: number,
  ): Promise<Result> {
    let minRand = 1;
    let res = await RobloxServerJoiner.reqRoblox(placeId, 0);
    let jsonData = await res.json();
    const totalSize = Math.floor(jsonData.TotalCollectionSize / 10);
    let maxRand = totalSize;
    const result: Result = {
      foundServer: undefined,
      closeServer: undefined,
    };
    for (let retry = 0; retry < maxTry; retry += 1) {
      if (this.onEachSearch) { this.onEachSearch(retry, maxTry, result); }
      const randIndex = RobloxServerJoiner.randomInRange(minRand, maxRand);
      res = await RobloxServerJoiner.reqRoblox(placeId, randIndex);
      jsonData = await res.json();
      const servers = jsonData.Collection;
      if (servers.length <= 0) {
        maxRand = randIndex;
        continue;
      }
      const sumPlayer = 0;
      let avgPlayer = 0;
      for (let i = 0; i < servers.length;) {
        const server = servers[i];
        const serverPlayerCount = server.CurrentPlayers.length;
        let closePlayerCount = Infinity;
        if (result.closeServer) {
          closePlayerCount = result.closeServer.CurrentPlayers.length;
        }
        if (serverPlayerCount === targetPlayerCount) {
          result.foundServer = server;
          return result;
        }
        const distServer = Math.abs(serverPlayerCount - targetPlayerCount);
        const distClose = Math.abs(closePlayerCount - targetPlayerCount);
        if (!result.closeServer || distServer < distClose) {
          result.closeServer = server;
        }
      }
      avgPlayer = Math.round(sumPlayer / servers.length);
      if (avgPlayer > targetPlayerCount) {
        minRand = randIndex;
      } else {
        maxRand = randIndex;
      }
    }
    return result;
  }

  public generatePlayButton(server: RobloxServer, id: string = 'custom-join-1') {
    const playButton = document.createElement('button');
    playButton.id = id;

    const Roblox = this.getRobloxGlobalObject();
    playButton.innerText = 'Play';
    if (!Roblox) {
      try {
        // inject play script due cannot access global object
        // eslint-disable-next-line
        playButton.setAttribute('onclick','Roblox.GameLauncher.joinGameInstance('+server.PlaceId+', "'+server.Guid+'")')
      } catch (error) {
        // TODO: handle this
        throw new Error('Roblox is not available');
      }
      return playButton;
    }
    playButton.onclick = Roblox.GameLauncher.joinGameInstance(server.PlaceId, server.Guid);
    return playButton;
  }

  public async joinWithDialogPlaceId(placeId: string) {
    const targetPlayer = Number(prompt('Place enter target player in server'));
    if (this.onStartSearch) this.onStartSearch();
    const result = await this.findServerWithTargetPlayer(targetPlayer, placeId, 30);
    const { foundServer } = result;
    const { closeServer } = result;

    let server;

    if (foundServer) {
      if (window.confirm(`Found server with ${foundServer.CurrentPlayers.length} player. Join now?`)) {
        server = foundServer;
      }
    } else if (closeServer) {
      if (window.confirm(`Cannot found server with ${targetPlayer}. But nearest found server with ${closeServer.CurrentPlayers.length} player. Join now?`)) {
        server = closeServer;
      }
    } else {
      alert('No server found');
    }

    if (this.onEndSearch) this.onEndSearch();

    if (server) {
      const btn = await this.generatePlayButton(server);
      window.document.body.append(btn);
      btn.click();
    }
  }
}

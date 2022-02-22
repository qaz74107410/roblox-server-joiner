// TODO: this need to be improve
export default class CustomUI {
  // https://www.roblox.com/reference/styleguide
  spinnerElem: HTMLSpanElement = document.createElement('span');

  defaultContentPlayButton = 'Custom Join';

  joinButton: HTMLButtonElement = document.createElement('button');

  constructor() {
    // apply Roblox style
    this.spinnerElem.className = 'spinner spinner-sm';
  }

  // generate custom play button
  public addCustomJoinButton(onClickFn: () => void) {
    const gameBtnContainers = document.getElementsByClassName('game-buttons-container');
    const gameBtnContainer = gameBtnContainers.length > 0 ? gameBtnContainers[0] : null;
    if (!gameBtnContainer) {
      // TODO: cannot find the game-buttons-container
      return;
    }

    // TODO: make prettier ui
    const btnContainer = document.createElement('div');
    btnContainer.className = 'game-details-play-button-container';
    this.joinButton.style.marginBottom = '5px';
    this.joinButton.className = 'btn-full-width btn-common-play-game btn-secondary-md btn-min-width';
    this.joinButton.textContent = this.defaultContentPlayButton;
    this.joinButton.addEventListener('click', onClickFn);

    btnContainer.append(this.joinButton);
    gameBtnContainer.prepend(btnContainer);
  }

  public withSpinner(elem: HTMLElement, text: string): HTMLElement {
    const spinner = this.spinnerElem.cloneNode();
    spinner.textContent = text;
    elem.append(spinner);
    return elem;
  }

  public restoreJoinButton() {
    this.joinButton.textContent = this.defaultContentPlayButton;
    this.joinButton.disabled = false;
  }
}

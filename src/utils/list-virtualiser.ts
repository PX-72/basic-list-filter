type HtmlElementTagType = keyof HTMLElementTagNameMap;

export type VirtualisationOptions = {
  rowHeight: number;
  listItemTag: HtmlElementTagType;
  endOfListBufferSize: number;
};

enum CssDisplay {
  NONE = 'none',
  BLOCK = 'block',
  INLINE_BLOCK = 'inline-block'
}

const calculateListVirtualisation = (element: HTMLElement, options: VirtualisationOptions): void => {
  let { rowHeight, listItemTag, endOfListBufferSize } = options;

  requestAnimationFrame(() => {
    const listItems = element.querySelectorAll(listItemTag);
    if (listItems.length === 0) return;

    const indexStart = Math.floor(element.scrollTop / rowHeight);
    const indexEnd = Math.min(
      Math.ceil((element.scrollTop + parseFloat(element.style.height)) / rowHeight - 1) + endOfListBufferSize,
      listItems.length - 1
    );

    let currentIndex = indexStart;

    for (let i = 0; i < listItems.length; i++) {
      const listItemElement = listItems[i];
      if (i >= indexStart && i <= indexEnd) {
        listItemElement.style.display = CssDisplay.BLOCK;
        listItemElement.style.top = `${currentIndex * rowHeight}px`;
        currentIndex++;
      } else if (listItemElement.style.display !== CssDisplay.NONE) {
        listItemElement.style.display = CssDisplay.NONE;
      }
    }
  });
};

const isValidVirtualisationInput = (inputOptions: VirtialistionInput): Readonly<[boolean, boolean, string]> => {
  const { containerElement, containerHeight: containerHight, listItemElements, listItemHeight } = inputOptions;
  const valid = [true, false, ''] as const;
  const invalid = (err: string) => [false, false, err] as const;
  const invalidAndThrow = (err: string) => [false, true, err] as const;

  if (containerHight <= 0) return invalidAndThrow('Container hight must be greater than zero.');
  if (listItemHeight <= 0) return invalidAndThrow('List item height must be greater than zero.');

  if (!containerElement) return invalidAndThrow('Parent element is null.');
  const parentHeight = parseFloat(containerElement.style.height);
  if (parentHeight <= 0) return invalidAndThrow('Parent element must have height greater than zero.');

  if (!listItemElements) return invalidAndThrow('Child elements array is null.');
  if (listItemElements.length === 0) return invalid('No child elements are provided.');
  const childHeight = parseFloat(listItemElements[0].style.height);
  if (childHeight <= 0) return invalidAndThrow('Child elements must have height greater than zero.');

  return valid;
};

const initialiseContainer = (containerElement: HTMLElement, containerHight: number): void => {
    containerElement.style.height = `${containerHight}px`;
    containerElement.style.overflowY = 'auto';
    containerElement.style.position = 'relative';
};

const initialiseListItemElements = (listItemElements: HTMLElement[], listItemHeight: number): void => {
    listItemElements.forEach((item: HTMLElement) => { 
      item.style.position = 'absolute';
      item.style.left = '0px';
      item.style.right = '0px';
      item.style.height = `${listItemHeight}px`;
    });
};


export type VirtialistionInput = {
  containerElement: HTMLElement;
  containerHeight: number;
  listItemElements: HTMLElement[];
  listItemHeight: number;
  endOfListBufferSize?: number;
};

export type VirtualisationResult = [HTMLElement, () => void];

export const virtualise = (inputOptions: VirtialistionInput): VirtualisationResult => {
  const { containerElement, containerHeight, listItemElements, listItemHeight, endOfListBufferSize = 10 } = inputOptions;

  initialiseContainer(containerElement, containerHeight);
  initialiseListItemElements(listItemElements, listItemHeight);

  const [isValid, mustThrow, err] = isValidVirtualisationInput(inputOptions);
  if (!isValid) {
    if (mustThrow) throw Error(err);

    console.log(err);
    return [containerElement, () => {}];
  }

  const numberOfVisibleItems = Math.ceil(containerHeight / listItemHeight) + endOfListBufferSize;
  listItemElements.forEach((e, i) => {
    e.style.display = i <= numberOfVisibleItems ? CssDisplay.BLOCK : CssDisplay.NONE;
  });

  const heightSetter = document.createElement('div');
  heightSetter.style.background = 'transparent';
  heightSetter.style.height = `${listItemElements.length * listItemHeight}px`;

  containerElement.appendChild(heightSetter);
  containerElement.append(...listItemElements);

  const calcOptions: VirtualisationOptions = {
    rowHeight: listItemHeight,
    listItemTag: listItemElements[0].tagName.toLocaleLowerCase() as HtmlElementTagType,
    endOfListBufferSize: endOfListBufferSize
  };

  let isThrottling = false;
  containerElement.addEventListener('scroll', function (this: HTMLElement, ev: Event) {
    if (isThrottling) return;

    isThrottling = true;
    setTimeout(() => {
      calculateListVirtualisation(containerElement, calcOptions);
      isThrottling = false;
    }, 0);
  });

  calculateListVirtualisation(containerElement, calcOptions);

  return [containerElement, () => calculateListVirtualisation(containerElement, calcOptions)];
};

type HtmlElementTagType = keyof HTMLElementTagNameMap;

export type VirtualisationOptions = {
  rowHeight?: number;
  listItemTag?: HtmlElementTagType;
  endOfListBufferSize?: number;
};

const calculateListVirtualisation = (element: HTMLElement, options: Required<VirtualisationOptions>): void => {
  let { rowHeight, listItemTag, endOfListBufferSize } = options;

  /* if (rowHeight === 0) {
    const actualRowHeight = element.querySelector(listItemTag)?.style.height;
    if (actualRowHeight === undefined) throw Error('row hight could not be determined.');
    rowHeight = parseFloat(actualRowHeight);
  } */

  requestAnimationFrame(() => {
    const listItems = element.querySelectorAll(listItemTag);
    if (listItems.length === 0) return;

    const indexStart = Math.floor(element.scrollTop / rowHeight);
    const indexEnd = Math.min(
      Math.ceil((element.scrollTop + parseFloat(element.style.height)) / rowHeight - 1) +
        endOfListBufferSize,
      listItems.length - 1
    );

    let currentIndex = indexStart;

    for (let i = 0; i < listItems.length; i++) {
      const listItemElement = listItems[i];
      if (i >= indexStart && i <= indexEnd) {
        listItemElement.style.display = 'block';
        listItemElement.style.top = `${currentIndex * rowHeight}px`;
        currentIndex++;
      } else if (listItemElement.style.display !== 'none') {
        listItemElement.style.display = 'none';
      }
    }
  });
};

let isThrottling = false;
const onScroll = (element: HTMLUListElement): void => {
  if (isThrottling) return;

  isThrottling = true;
  setTimeout(() => {
    calculateListVirtualisation({listContainerElement: element, rowHeight: ROW_HEIGHT});
    isThrottling = false;
  }, 0);
};

//TODO: 
// 1. completely move all list elements here 
// 2. build list based on data source in main vitualise() function
// 3. move isThrottling in the function body below

export const virtualise = (element: HTMLElement, options: Omit<VirtualisationOptions, 'rowHeight'> = {}): 
[virtualisedElement: HTMLElement, calculateVirtualisation: () => void] =>  {
  let { listItemTag = 'li', endOfListBufferSize = 10 } = options;

  const listItems = element.querySelectorAll(listItemTag);
  if (listItems.length === 0) return [element, () => {}];

  const firstListElement = element.querySelector(listItemTag);
  if (!firstListElement) throw Error('row hight could not be determined.');
  const rowHeight = parseFloat(firstListElement.style.height);

  const heightSetter = document.createElement('div');
  heightSetter.style.background = 'transparent';
  heightSetter.style.height = `${listItems.length * rowHeight}px`;

  element.appendChild(heightSetter);

}

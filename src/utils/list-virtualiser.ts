type HtmlElementTagType = keyof HTMLElementTagNameMap;

export type VirtualisationOptions = {
  listContainerElement: HTMLElement;
  rowHight?: number;
  listItemTag?: HtmlElementTagType;
  endOfListBufferSize?: number;
};

export const calculateListVirtualisation = (options: VirtualisationOptions): void => {
  let { listContainerElement, rowHight = 0, listItemTag = 'li', endOfListBufferSize = 10 } = options;
  
  if (rowHight === 0) {
    const actualRowHeight = listContainerElement.querySelector(listItemTag)?.style.height;
    if (actualRowHeight === undefined) throw Error('row hight could not be determined.')
    rowHight = parseFloat(actualRowHeight);
  }

  requestAnimationFrame(() => {
    const listItems = listContainerElement.querySelectorAll(listItemTag);
    const indexStart = Math.floor(listContainerElement.scrollTop / rowHight);
    const indexEnd = Math.min(
      Math.ceil((listContainerElement.scrollTop + parseFloat(listContainerElement.style.height)) / rowHight - 1) + endOfListBufferSize,
      listItems.length - 1
    );

    let currentIndex = indexStart;

    for (let i = 0; i < listItems.length; i++) {
      const listItemElement = listItems[i];
      if (i >= indexStart && i <= indexEnd) {
        listItemElement.style.display = 'block';
        listItemElement.style.top = `${currentIndex * rowHight}px`;
        currentIndex++;
      } else if (listItemElement.style.display !== 'none') {
        listItemElement.style.display = 'none';
      }
    }
  });
};

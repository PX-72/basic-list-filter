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
};

const calculateListVirtualisation = (element: HTMLElement, options: VirtualisationOptions): void => {
  let { rowHeight, listItemTag, endOfListBufferSize } = options;

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

const isValidVirtualisationInput = (parentElement: HTMLElement, childElements: HTMLElement[]): Readonly<[boolean, boolean, string]> {
  const valid = [true, false, ''] as const;
  const invalid = (err: string) => [false, false, err] as const;
  const invalidAndThrow = (err: string) => [false, true, err] as const;

  if (!parentElement) return invalidAndThrow('Parent element is null.');
  const parentHeight = parentElement.style.height;
  if (!parentHeight || parseFloat(parentHeight) <= 0) return invalidAndThrow('Parent element style must have height provided.');

  if (!childElements) return invalidAndThrow('Child elements array is null.');
  if (childElements.length === 0) return invalid('No child elements are provided.');
  const childHeight = childElements[0].style.height;
  if (!childHeight || parseFloat(childHeight) <= 0) return invalidAndThrow('Child elements style must have height provided.');

  return valid;
}

//TODO: 
// 1. completely move all list elements here 
// 2. build list based on data source in main vitualise() function
// 3. move isThrottling in the function body below

type VirtualisationResult = [HTMLElement, (() => void)];

export const virtualise = (parentElement: HTMLElement, childElements: HTMLElement[], endOfListBufferSize = 10): VirtualisationResult =>  {
  const emptyResult: VirtualisationResult = [parentElement, () => {}];
  const [isValid, mustThrow, err] = isValidVirtualisationInput(parentElement, childElements);
  if (!isValid) {
    if (mustThrow) throw Error(err);

    console.log(err);
    return emptyResult;
  }

  const parentHeight = parseFloat(parentElement.style.height);
  const rowHeight = parseFloat(childElements[0].style.height);
  const numberOfVisibleItems = Math.ceil(parentHeight / rowHeight) + endOfListBufferSize;
  childElements.forEach((e, i) => { e.style.display = i <= numberOfVisibleItems ? CssDisplay.BLOCK : CssDisplay.NONE });

  const heightSetter = document.createElement('div');
  heightSetter.style.background = 'transparent';
  heightSetter.style.height = `${childElements.length * rowHeight}px`;
  
  parentElement.appendChild(heightSetter);
  parentElement.append(...childElements);

  const calcOptions: VirtualisationOptions = { 
    rowHeight: rowHeight, 
    listItemTag: childElements[0].tagName.toLocaleLowerCase() as HtmlElementTagType, 
    endOfListBufferSize: endOfListBufferSize 
  };

  let isThrottling = false;
  parentElement.addEventListener('scroll', function(this: HTMLElement, ev: Event) {
    if (isThrottling) return;

    isThrottling = true;
    setTimeout(() => {
      calculateListVirtualisation(parentElement, calcOptions);
      isThrottling = false;
    }, 0);
  });

  return [parentElement, () => calculateListVirtualisation(parentElement, calcOptions)];
};

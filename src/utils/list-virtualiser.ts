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

const isValidVirtualisationInput = (
  parentElement: HTMLElement,
  childElements: HTMLElement[]
): Readonly<[boolean, boolean, string]> => {
  const valid = [true, false, ''] as const;
  const invalid = (err: string) => [false, false, err] as const;
  const invalidAndThrow = (err: string) => [false, true, err] as const;

  if (!parentElement) return invalidAndThrow('Parent element is null.');
  const parentHeight = parentElement.getBoundingClientRect().height;
  if (parentHeight <= 0)
    return invalidAndThrow('Parent element must have height greater than zero.');

  if (!childElements) return invalidAndThrow('Child elements array is null.');
  if (childElements.length === 0) return invalid('No child elements are provided.');
  const childHeight = childElements[0].getBoundingClientRect().height
  console.log(childElements[0]);
  if (childHeight <= 0)
    return invalidAndThrow('Child elements must have height greater than zero.');

  return valid;
};

type VirtualisationResult = [HTMLElement, () => void];

export const virtualise = (
  parentElement: HTMLElement,
  childElements: HTMLElement[],
  endOfListBufferSize = 10
): VirtualisationResult => {
  console.log(parentElement.style);
  const [isValid, mustThrow, err] = isValidVirtualisationInput(parentElement, childElements);
  if (!isValid) {
    if (mustThrow) throw Error(err);

    console.log(err);
    return [parentElement, () => {}];
  }

  const parentHeight = parentElement.getBoundingClientRect().height;
  const rowHeight = childElements[0].getBoundingClientRect().height;
  const numberOfVisibleItems = Math.ceil(parentHeight / rowHeight) + endOfListBufferSize;
  childElements.forEach((e, i) => {
    e.style.display = i <= numberOfVisibleItems ? CssDisplay.BLOCK : CssDisplay.NONE;
  });

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
  parentElement.addEventListener('scroll', function (this: HTMLElement, ev: Event) {
    if (isThrottling) return;

    isThrottling = true;
    setTimeout(() => {
      calculateListVirtualisation(parentElement, calcOptions);
      isThrottling = false;
    }, 0);
  });

  return [parentElement, () => calculateListVirtualisation(parentElement, calcOptions)];
};

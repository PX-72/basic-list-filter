const MAX_HEIGHT = 15_000_000;

type ScrollDirection = 'up' | 'down' | 'unknown';
type DataSetAttribute = Record<'inputKey' | 'htmlKey', string>;

const HEIGHT_SETTER_MARKER: DataSetAttribute = {
  inputKey: 'heightSetterMarker',
  htmlKey: 'data-height-setter-marker'
};

const ROW_ELEMENT_MARKER: DataSetAttribute = {
  inputKey: 'rowElementMarker',
  htmlKey: 'data-row-element-marker'
};

const buildListItems = <T>(
  data: T[],
  rowBuilder: RowBuilder<T>,
  positionStartIndex: number,
  firstIndex: number,
  lastIndex: number,
  rowHeight: number
): HTMLElement[] => {
  const result: HTMLElement[] = [];
  for (let i = firstIndex, p = positionStartIndex; i <= lastIndex; i++, p++) {
    const item = rowBuilder(data[i], i);
    item.style.position = 'absolute';
    item.style.left = '0px';
    item.style.right = '0px';
    item.style.top = `${p * rowHeight}px`;
    item.style.height = `${rowHeight}px`;
    item.dataset[ROW_ELEMENT_MARKER.inputKey] = 'true';
    result.push(item);
  }

  return result;
};

const calculateListVirtualisation = <T>(
  data: T[],
  // true if scroll height is too high - it is to avoid browsers limiting scrolling
  requiresIndexInterpolation: boolean,
  options: VirtialistionInput<T>,
  scrollDirection: ScrollDirection
): void => {
  let { containerElement, containerHeight, rowBuilder, rowHeight } = options;

  //TODO: ROUNDING CAUSES PROBLEMS AFTER FILTERING!
  requestAnimationFrame(() => {
    const scrollTop = containerElement.scrollTop;
    console.log(scrollTop);
    const positionStartIndex = Math.floor(scrollTop / rowHeight);

    const startIndex = requiresIndexInterpolation
      ? Math.floor((positionStartIndex / Math.floor(MAX_HEIGHT / rowHeight)) * data.length)
      : positionStartIndex;

    const endIndex = Math.min(
      requiresIndexInterpolation
        ? Math.ceil(startIndex + (containerHeight / rowHeight))
        : Math.floor((scrollTop + containerHeight) / rowHeight - 1),
      data.length - 1
    );

    const currentListItems = containerElement.querySelectorAll<HTMLElement>(`[${ROW_ELEMENT_MARKER.htmlKey}]`);
    const newRowItems = buildListItems(data, rowBuilder, positionStartIndex, startIndex, endIndex, rowHeight);

    if (requiresIndexInterpolation && endIndex === data.length - 1 && scrollDirection === 'down') {
      //console.dir(newRowItems.at(-1));
      if (newRowItems.length === 0) return;

      // TODO: FIX THIS UGLY HACK, (if possible)
      for (let i = 0; i < currentListItems.length; i++) {
        if(newRowItems[i] !== undefined) {
          currentListItems[i].innerHTML = newRowItems[i].innerHTML;
        } else {
          currentListItems[i].style.visibility = 'hidden';
        }
      }
    } else {
      currentListItems.forEach((el) => el.remove());
      newRowItems.forEach((el) => containerElement.appendChild(el));
    }
  });
};

type RowBuilder<T> = (item: T, index: number) => HTMLElement;

export type VirtialistionInput<T> = {
  containerElement: HTMLElement;
  containerHeight: number;
  rowBuilder: RowBuilder<T>;
  rowHeight: number;
};

const getHeightSetterCssHeight = (dataLength: number, rowHeight: number, containerHeight: number): string => {
  const total = dataLength * rowHeight;
  let calculatedHeight = total;
  // Adjust height proportional to total data length to avoid end of list (bottom scroll) display bug
  if (calculatedHeight >= MAX_HEIGHT) {
    calculatedHeight = MAX_HEIGHT + Math.min(containerHeight - rowHeight, Math.ceil(containerHeight * 0.8));
  }
  return `${calculatedHeight}px`;
};

const createHeightSetter = () => {
  const heightSetter = document.createElement('div');
  heightSetter.style.background = 'transparent';
  heightSetter.dataset[HEIGHT_SETTER_MARKER.inputKey] = 'true';
  return heightSetter;
};

const removeHeightSetter = (element: HTMLElement) => {
  const heightSetter = element.querySelector<HTMLElement>(`[${HEIGHT_SETTER_MARKER.htmlKey}]`)!;
  if(heightSetter)
  {
    console.log('removed height setter');
    element.removeChild(heightSetter);
  }  
};

export const virtualise = <T>(inputOptions: VirtialistionInput<T>): [HTMLElement, (data: T[]) => void] => {
  const { containerElement, containerHeight, rowHeight } = inputOptions;

  containerElement.style.height = `${containerHeight}px`;
  containerElement.style.overflowY = 'auto';
  containerElement.style.position = 'relative';

  const load = (data: T[]) => {
    const requiresIndexInterpolation = data.length * rowHeight > MAX_HEIGHT;
    
    const h = getHeightSetterCssHeight(data.length, rowHeight, containerHeight);
    console.log(h, data.length);
    
    removeHeightSetter(containerElement);
    const heightSetter = createHeightSetter();
    heightSetter.style.height = h;
    containerElement.appendChild(heightSetter);

    containerElement.scrollTop = 0;

    let isThrottling = false;
    let previousScrollTop = 0;
    function onScroll(this: HTMLElement, ev: Event) {
      if (isThrottling) return;

      isThrottling = true;
      setTimeout(() => {
        const srollDirection: ScrollDirection = previousScrollTop < this.scrollTop ? 'down' : 'up';
        calculateListVirtualisation<T>(data, requiresIndexInterpolation, inputOptions, srollDirection);
        previousScrollTop = this.scrollTop;
        isThrottling = false;
      }, 2);
    }

    containerElement.removeEventListener('scroll', onScroll);
    containerElement.addEventListener('scroll', onScroll);

    calculateListVirtualisation<T>(data, requiresIndexInterpolation, inputOptions, 'unknown');
  };

  return [containerElement, load];
};

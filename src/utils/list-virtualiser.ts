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

  requestAnimationFrame(() => {
    const scrollTop = containerElement.scrollTop;
    const positionStartIndex = Math.ceil(scrollTop / rowHeight);

    const startIndex = requiresIndexInterpolation
      ? Math.ceil((positionStartIndex / Math.ceil(MAX_HEIGHT / rowHeight)) * data.length)
      : positionStartIndex;

    const endIndex = Math.min(
      requiresIndexInterpolation
        ? Math.ceil(startIndex + containerHeight / rowHeight)
        : Math.floor((scrollTop + containerHeight) / rowHeight - 1),
      data.length - 1
    );

    const currentListItems = containerElement.querySelectorAll(`[${ROW_ELEMENT_MARKER.htmlKey}]`);
    const newRowItems = buildListItems(data, rowBuilder, positionStartIndex, startIndex, endIndex, rowHeight);

    if (endIndex === data.length - 1 && scrollDirection === 'down') {
      console.log('at the end');
      // todo: fix it! last batch is not added
      return;
    }

    currentListItems.forEach((el) => el.remove());
    newRowItems.forEach((el) => containerElement.appendChild(el));
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

export const virtualise = <T>(inputOptions: VirtialistionInput<T>): [HTMLElement, (data: T[]) => void] => {
  const { containerElement, containerHeight, rowHeight } = inputOptions;

  const heightSetter = createHeightSetter();

  containerElement.style.height = `${containerHeight}px`;
  containerElement.style.overflowY = 'auto';
  containerElement.style.position = 'relative';
  containerElement.appendChild(heightSetter);

  const load = (data: T[]) => {
    const requiresIndexInterpolation = data.length * rowHeight > MAX_HEIGHT;

    containerElement.scrollTop = 0;

    const h = getHeightSetterCssHeight(data.length, rowHeight, containerHeight);
    console.log(h);
    heightSetter.style.height = h;

    let isThrottling = false;
    let previousScrollTop = 0;
    function onScroll(this: HTMLElement, ev: Event) {
      if (isThrottling) return;

      isThrottling = true;
      setTimeout(() => {
        const srollDirection: ScrollDirection = previousScrollTop < this.scrollTop ? 'down' : 'up';
        calculateListVirtualisation<T>(data, requiresIndexInterpolation, inputOptions, srollDirection);
        console.log(previousScrollTop, this.scrollTop, srollDirection);
        previousScrollTop = this.scrollTop;
        isThrottling = false;
      }, 50);
    }

    containerElement.removeEventListener('scroll', onScroll);
    containerElement.addEventListener('scroll', onScroll);

    calculateListVirtualisation<T>(data, requiresIndexInterpolation, inputOptions, 'unknown');
  };

  return [containerElement, load];
};

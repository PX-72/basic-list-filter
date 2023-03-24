const MAX_HEIGHT = 15_000_000;

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
  firstIndex: number,
  lastIndex: number,
  rowHeight: number
): HTMLElement[] => {
  const result: HTMLElement[] = [];
  for (let i = firstIndex; i <= lastIndex; i++) {
    const item = rowBuilder(data[i]);
    item.style.position = 'absolute';
    item.style.left = '0px';
    item.style.right = '0px';
    item.style.top = `${i * rowHeight}px`;
    item.style.height = `${rowHeight}px`;
    item.dataset[ROW_ELEMENT_MARKER.inputKey] = 'true';
    result.push(item);
  }

  return result;
};

const calculateListVirtualisation = <T>(data: T[], options: VirtialistionInput<T>): void => {
  let { containerElement, containerHeight, rowBuilder, rowHeight, endOfListBufferSize = 10 } = options;

  requestAnimationFrame(() => {
    const scrollTop = containerElement.scrollTop;
    const indexStart = Math.floor(scrollTop / rowHeight);
    const indexEnd = Math.min(
      Math.ceil((scrollTop + containerHeight) / rowHeight - 1) + endOfListBufferSize,
      data.length - 1
    );

    const currentListItems = document.querySelectorAll(`[${ROW_ELEMENT_MARKER.htmlKey}]`);
    currentListItems.forEach((el) => el.remove());

    const newRowItems = buildListItems(data, rowBuilder, indexStart, indexEnd, rowHeight);
    newRowItems.forEach((el) => containerElement.appendChild(el));
  });
};

type RowBuilder<T> = (item: T) => HTMLElement;

export type VirtialistionInput<T> = {
  containerElement: HTMLElement;
  containerHeight: number;
  rowBuilder: RowBuilder<T>;
  rowHeight: number;
  endOfListBufferSize?: number;
};

const createHeightSetter = (height: number) => {
  const heightSetter = document.createElement('div');
  heightSetter.style.background = 'transparent';
  heightSetter.style.height = `${height}px`;
  heightSetter.dataset[HEIGHT_SETTER_MARKER.inputKey] = 'true';
  return heightSetter;
}

export const virtualise = <T>(inputOptions: VirtialistionInput<T>): [HTMLElement, (data: T[]) => void] => {
  const { containerElement, containerHeight, rowHeight } = inputOptions;

  const heightSetter = createHeightSetter(0);

  containerElement.style.height = `${containerHeight}px`;
  containerElement.style.overflowY = 'auto';
  containerElement.style.position = 'relative';
  containerElement.appendChild(heightSetter);

  const load = (data: T[]) => {
    heightSetter.style.height = `${data.length * rowHeight}px`;

    let isThrottling = false;
    function onScroll(this: HTMLElement, ev: Event) {
      if (isThrottling) return;
  
      isThrottling = true;
      setTimeout(() => {
        calculateListVirtualisation<T>(data, inputOptions);
        isThrottling = false;
      }, 0);
    }

    containerElement.removeEventListener('scroll', onScroll);
    containerElement.addEventListener('scroll', onScroll);

    calculateListVirtualisation<T>(data, inputOptions);
  };

  return [containerElement, load];
};

type DataSetAttribute = {
  inputKey: string,
  htmlKey: string
};

const HEIGHT_SETTER_MARKER: DataSetAttribute = {
  inputKey: 'heightSetterMarker',
  htmlKey: 'data-height-setter-marker'
};

const ROW_ELEMENT_MARKER: DataSetAttribute = {
  inputKey: 'rowElementMarker',
  htmlKey: 'data-row-element-marker'
};

export type VirtialistionInput<T> = {
  containerElement: HTMLElement;
  containerHeight: number;
  dataList: T[];
  rowBuilder: (item: T) => HTMLElement;
  rowHeight: number;
  endOfListBufferSize?: number;
};

export type VirtualisationResult = [HTMLElement, () => void];

type RowBuilder<T> = Pick<VirtialistionInput<T>, 'dataList' | 'rowBuilder'>;

enum CssDisplay {
  NONE = 'none',
  BLOCK = 'block',
  INLINE_BLOCK = 'inline-block'
}

const buildListItems = <T>(
  rowBuilder: RowBuilder<T>,
  firstIndex: number,
  lastIndex: number,
  rowHeight: number
): HTMLElement[] => {
  const result: HTMLElement[] = [];
  for (let i = firstIndex; i < lastIndex; i++) {
    const item = rowBuilder.rowBuilder(rowBuilder.dataList[i]);
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

const calculateListVirtualisation = <T>(
  element: HTMLElement,
  options: Omit<VirtialistionInput<T>, 'containerElement' | 'containerHeight'>
): void => {
  let { dataList, rowBuilder, rowHeight, endOfListBufferSize = 0 } = options;

  requestAnimationFrame(() => {
    const indexStart = Math.floor(element.scrollTop / rowHeight);
    const indexEnd = Math.min(
      Math.ceil((element.scrollTop + parseFloat(element.style.height)) / rowHeight - 1) + endOfListBufferSize,
      dataList.length
    );

    const currentListItems = document.querySelectorAll(`[${ROW_ELEMENT_MARKER.htmlKey}]`);
    currentListItems.forEach(el => el.remove());

    let currentIndex = indexStart;

    const newRowItems = buildListItems({ dataList, rowBuilder }, indexStart, indexEnd, rowHeight);
    newRowItems.forEach(el => element.appendChild(el));
  });
};

const createHeightSetter = (rowHeight: number, dataListLength: number): HTMLElement => {
  const heightSetter = document.createElement('div');
  heightSetter.style.background = 'transparent';
  heightSetter.style.height = `${dataListLength * rowHeight}px`;
  heightSetter.dataset[HEIGHT_SETTER_MARKER.inputKey] = 'true';
  return heightSetter;
};

const initialiseContainer = (
  containerElement: HTMLElement,
  containerHight: number,
  rowHeight: number,
  dataListLength: number
): void => {
  containerElement.style.height = `${containerHight}px`;
  containerElement.style.overflowY = 'auto';
  containerElement.style.position = 'relative';

  containerElement.appendChild(createHeightSetter(rowHeight, dataListLength));
};

export const virtualise = <T>(inputOptions: VirtialistionInput<T>): VirtualisationResult => {
  const { containerElement, containerHeight, dataList, rowBuilder, rowHeight, endOfListBufferSize = 10 } = inputOptions;
  const calcInput = { dataList, rowBuilder, rowHeight, endOfListBufferSize };

  initialiseContainer(containerElement, containerHeight, rowHeight, dataList.length);

  const numberOfVisibleItems = Math.ceil(containerHeight / rowHeight) + endOfListBufferSize;

  let isThrottling = false;
  containerElement.addEventListener('scroll', function (this: HTMLElement, ev: Event) {
    if (isThrottling) return;

    isThrottling = true;
    setTimeout(() => {
      calculateListVirtualisation<T>(containerElement, calcInput);
      isThrottling = false;
    }, 0);
  });

  calculateListVirtualisation<T>(containerElement, calcInput);

  return [containerElement, () => calculateListVirtualisation<T>(containerElement, calcInput)];
};

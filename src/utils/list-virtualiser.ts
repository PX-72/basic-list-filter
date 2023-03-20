import { interpolate } from './interpolation.js';

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

const calculateListVirtualisation = <T>(options: VirtialistionInput<T>): void => {
  let { containerElement, containerHeight, dataList, rowBuilder, rowHeight, endOfListBufferSize = 0 } = options;

  requestAnimationFrame(() => {

    const scrollTopNonInterpolated  = (containerElement.scrollTop / (dataList.length * rowHeight)) * 15_000_000;
    const scrollTop  = interpolate(0,  dataList.length * rowHeight, 0, 15_000_000,  containerElement.scrollTop);
    //const scrollTop = containerElement.scrollTop; 
    console.log(`calculated scroll top: ${scrollTop.toLocaleString()}; real scrollTop: ${containerElement.scrollTop.toLocaleString()}`);
    const indexStart = Math.floor(scrollTop / rowHeight);
    const indexEnd = Math.min(
      Math.ceil((scrollTop + containerHeight) / rowHeight - 1) + endOfListBufferSize,
      dataList.length
    );

    const currentListItems = document.querySelectorAll(`[${ROW_ELEMENT_MARKER.htmlKey}]`);
    currentListItems.forEach(el => el.remove());

    let currentIndex = indexStart;

    const newRowItems = buildListItems({ dataList, rowBuilder }, indexStart, indexEnd, rowHeight);
    newRowItems.forEach(el => containerElement.appendChild(el));
  });
};

const createHeightSetters = (rowHeight: number, dataListLength: number): HTMLElement[] => {
  const maxHeight = 10_000_000;
  const height = dataListLength * rowHeight;
  console.log(`height: ${height.toLocaleString()}; maxHeight: ${maxHeight.toLocaleString()}`);
  const heightArray: number[] = [];
  if (height <= maxHeight) {
    heightArray.push(height);
  } else {
    const maxHeightCount = Math.trunc(height / maxHeight);
    console.log(`maxHeightCount: ${maxHeightCount.toLocaleString()}`);
    heightArray.push(...Array(maxHeightCount).fill(maxHeight));
    const remainderHeight = height - (maxHeightCount * maxHeight);
    console.log(`remainderHeight: ${remainderHeight.toLocaleString()}`);
    if (remainderHeight > 0) heightArray.push(remainderHeight);
  }

  console.log('----------------------------------------------------------------');
  
  const result: HTMLElement[] = [];
  heightArray.forEach((h, i) => {
    const heightSetter = document.createElement('div');
    heightSetter.style.background = 'transparent';
    heightSetter.style.height = `${h}px`;
    console.log(`DIV ${i}: ${h.toLocaleString()}`);
    heightSetter.dataset[HEIGHT_SETTER_MARKER.inputKey] = 'true';
    result.push(heightSetter);
  });
  
  return result;
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

  createHeightSetters(rowHeight, dataListLength).forEach(setter => containerElement.appendChild(setter));
};

export const virtualise = <T>(inputOptions: VirtialistionInput<T>): VirtualisationResult => {
  const { containerElement, containerHeight, dataList, rowHeight, endOfListBufferSize = 10 } = inputOptions;

  initialiseContainer(containerElement, containerHeight, rowHeight, dataList.length);

  let isThrottling = false;
  containerElement.addEventListener('scroll', function (this: HTMLElement, ev: Event) {
    if (isThrottling) return;

    isThrottling = true;
    setTimeout(() => {
      calculateListVirtualisation<T>(inputOptions);
      isThrottling = false;
    }, 0);
  });

  calculateListVirtualisation<T>(inputOptions);

  return [containerElement, () => calculateListVirtualisation<T>(inputOptions)];
};

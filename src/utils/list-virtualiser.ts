import { interpolate } from './interpolation.js';

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
  positionStartIndex: number,
  firstIndex: number,
  lastIndex: number,
  rowHeight: number
): HTMLElement[] => {
  const result: HTMLElement[] = [];
  for (let i = firstIndex, p = positionStartIndex; i <= lastIndex; i++, p++) {
    const item = rowBuilder(data[i]);
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

const calculateListVirtualisation = <T>(data: T[], options: VirtialistionInput<T>): void => {
  let { containerElement, containerHeight, rowBuilder, rowHeight, endOfListBufferSize = 10 } = options;

  requestAnimationFrame(() => {
    const scrollTop = containerElement.scrollTop;
    //const interpolatedScrollTop = interpolate(0, MAX_HEIGHT, 0, rowHeight * data.length, scrollTop);
    
    //const indexEnd = Math.ceil(Math.min(indexStart + (containerHeight / rowHeight), data.length - 1));
    /* Math.min(
      Math.ceil((scrollTop + containerHeight) / rowHeight - 1) + endOfListBufferSize,
      data.length - 1
    ); */

    const positionStartIndex = Math.ceil(scrollTop / rowHeight);

    const currentListItems = containerElement.querySelectorAll(`[${ROW_ELEMENT_MARKER.htmlKey}]`);
    currentListItems.forEach((el) => el.remove());

    //const interpolatedTVal = Math.ceil((positionStartIndex / Math.ceil(MAX_HEIGHT / rowHeight)) * data.length);
    //const t = interpolate(0, Math.ceil(MAX_HEIGHT / rowHeight), 0, data.length, positionStartIndex);
    //const startIndex = Math.ceil(interpolate(0, Math.ceil(MAX_HEIGHT / rowHeight), 0, data.length, positionStartIndex));
    const startIndex = Math.ceil((positionStartIndex / Math.ceil(MAX_HEIGHT / rowHeight)) * data.length);
    const endIndex = Math.min(Math.floor((startIndex + (containerHeight / rowHeight))), data.length - 1);
    const newRowItems = buildListItems(data, rowBuilder, positionStartIndex, startIndex, endIndex, rowHeight);
    newRowItems.forEach((el) => containerElement.appendChild(el));

    console.log(positionStartIndex, startIndex, endIndex, newRowItems.length);
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

const getClampedCssHeight = (height: number): string => `${Math.min(height, MAX_HEIGHT)}px`;

const createHeightSetter = (height: number) => {
  const heightSetter = document.createElement('div');
  heightSetter.style.background = 'transparent';
  heightSetter.style.height = getClampedCssHeight(height);
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
    heightSetter.style.height = getClampedCssHeight(data.length * rowHeight);

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

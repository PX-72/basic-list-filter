import { html, build, appendGlobalStyles, createCssSelector, textInput } from './utils/dom-helper.js';
import { getContexts, Context } from './api/context-api.js';
import { calculateListVirtualisation } from './utils/list-virtualiser.js';

const DATA_ID_PROPERTY = 'data-id';
const DEBOUNCE_INTERVAL = 300;
const DATA_SIZE = 10000;

const ROW_HEIGHT = 30;
const BUFFER_SIZE = 10; // extra list items to render at the bottom of the list (outside)
const LIST_ITEM_TAG = 'li';

const INPUT_STYLE = `
  padding: 10px;
  color: #9a8c98;
  width: 35rem;
  border-radius: 10px;
  outline: none;
  border: none;
  font-size: 1rem;
  margin: 12px 0 0 20px;
`;

const UL_STYLE = `
  margin: 20px 0 0 0;
  padding: 0 0 0 0;
  border-top: 1px solid gray;
  list-style-type: none;
  height: 800px; 
  overflow-y: auto;
  position: relative;
`;

const HEIGHT_SETTER_STYLE = `
  background-color: transparent !important;
  height: ${DATA_SIZE * ROW_HEIGHT}px;
`;

const LIST_ITEM_STYLE = `
  border-top: 1px solid #14213d;
  position: absolute;
  left: 0;
  right: 0;
  display: none; 
  height: ${ROW_HEIGHT}px;
`;

const ITEM_CONTAINER_CSS = '.item-container';
const ITEM_CONTAINER = `
  didsplay: flex;
  flex-direction: row;
`;

const ITEM_CSS = '.item';
const ITEM = `
  margin-left: 25px;
  display: inline-block;
  padding-top: 6px;
`;

const ID_ITEM_CSS = '.id-item';
const ID_ITEM = `
  ${ITEM}
  width: 30px;
  display: inline-block;
`;

const data: Context[] = await getContexts(DATA_SIZE);

appendGlobalStyles(
  createCssSelector(LIST_ITEM_TAG, LIST_ITEM_STYLE),
  createCssSelector(ITEM_CONTAINER_CSS, ITEM_CONTAINER),
  createCssSelector(ITEM_CSS, ITEM),
  createCssSelector(ID_ITEM_CSS, ID_ITEM)
);

const filter = (value: string, ul: HTMLElement): void => {
  const mustShowAll = value === undefined || value === '' || value.trim().length === 0;
  let matchedIds = new Set<string | null>();

  if (!mustShowAll) {
    matchedIds = new Set<string | null>(
      data
        .filter((context) => context.description.toLowerCase().includes(value.toLowerCase()))
        .map((context) => context.id.toString())
    );
  }

  requestAnimationFrame(() => {
    for (const listItemElement of ul.querySelectorAll('li')) {
      if (mustShowAll || matchedIds.has(listItemElement.getAttribute(DATA_ID_PROPERTY))) {
        listItemElement.style.display = 'block';
      } else {
        listItemElement.style.display = 'none';
      }
    }
  });
};

// TODO: REPLACE WITH NEW FUNCTION FROM ./utils/list-virtualiser.js
const calculateListElements = (parentElement: HTMLElement): void => {
  const indexStart = Math.floor(parentElement.scrollTop / ROW_HEIGHT);
  const indexEnd = Math.min(
    Math.ceil(Math.ceil((parentElement.scrollTop + parseFloat(parentElement.style.height)) / ROW_HEIGHT - 1)) + BUFFER_SIZE,
    DATA_SIZE - 1
  );

  requestAnimationFrame(() => {
    let currentIndex = indexStart;
    for (const listItemElement of parentElement.querySelectorAll(LIST_ITEM_TAG)) {
      const index = Number(listItemElement.getAttribute(DATA_ID_PROPERTY));
      if (index >= indexStart && index <= indexEnd) {
        listItemElement.style.display = 'block';
        listItemElement.style.top = `${currentIndex * ROW_HEIGHT}px`;
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
    calculateListElements(element);
    isThrottling = false;
  }, 0);
};

const heightSetterElement = build('div', { style: HEIGHT_SETTER_STYLE });
const ul = build<HTMLUListElement>('ul', { style: UL_STYLE, eventType: 'scroll', eventCallback: onScroll });

calculateListElements(ul);

let timeoutId: number = 0;
const filterTextChanged = (element: HTMLInputElement) => {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => filter(element.value, ul), DEBOUNCE_INTERVAL);
};

const input = textInput(filterTextChanged, '', INPUT_STYLE);

const buildItem = (context: Context): HTMLElement =>
  html(
    build(LIST_ITEM_TAG, { attributes: { [DATA_ID_PROPERTY]: context.id.toString() }}),
    html(
      build('div', { classNames: [ITEM_CONTAINER_CSS] }),
      build('span', { text: context.id.toString(), classNames: [ID_ITEM_CSS] }),
      build('span', { text: context.volume.toString(), classNames: [ITEM_CSS] }),
      build('span', { text: context.description, classNames: [ITEM_CSS] })
    )
  );

const createList = (contexts: Context[]): HTMLElement =>
  html(ul, heightSetterElement, ...data.map((d) => buildItem(d)));

html(document.querySelector<HTMLElement>('#app')!, input, createList(data));

input.focus();

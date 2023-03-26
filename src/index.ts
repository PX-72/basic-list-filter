import { html, build, appendGlobalStyles, createCssSelector, textInput } from './utils/dom-helper.js';
import { getContexts, Context } from './api/context-api.js';
import { virtualise } from './utils/list-virtualiser.js';

const DATA_ID_PROPERTY = 'data-id';
const DEBOUNCE_INTERVAL = 50;
const DATA_SIZE = 8_500_000;

const FILTER_INPUT_BOX_CSS = '.filter-box';
const FILTER_INPUT_STYLE = `
  padding: 10px;
  color: #9a8c98;
  width: 35rem;
  border-radius: 10px;
  outline: none;
  border: none;
  font-size: 1rem;
  margin: 12px 0 0 20px;
`;

const LIST_CONTAINER_CSS = '.list-container';
const LIST_CONTAINER_STYLE = `
  margin: 20px 0 0 0;
  padding: 0 0 0 0;
  border-top: 1px solid gray;
  list-style-type: none;
`;

const LIST_ITEM_CSS = '.list-item';
const LIST_ITEM_STYLE = `
  border-top: 1px solid #14213d;
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
  width: 60px;
`;

const data: Context[] = await getContexts(DATA_SIZE, 0);

appendGlobalStyles(
  createCssSelector(FILTER_INPUT_BOX_CSS, FILTER_INPUT_STYLE),
  createCssSelector(LIST_CONTAINER_CSS, LIST_CONTAINER_STYLE),
  createCssSelector(LIST_ITEM_CSS, LIST_ITEM_STYLE),
  createCssSelector(ITEM_CONTAINER_CSS, ITEM_CONTAINER),
  createCssSelector(ITEM_CSS, ITEM),
  createCssSelector(ID_ITEM_CSS, ID_ITEM)
);

const buildItem = (context: Context, index: number): HTMLElement =>
  html(
    build('li', { classNames: [LIST_ITEM_CSS], attributes: { [DATA_ID_PROPERTY]: context.id.toString() } }),
    html(
      build('div', { classNames: [ITEM_CONTAINER_CSS] }),
      build('span', { text: index.toString(), classNames: [ID_ITEM_CSS] }),
      build('span', { text: context.id.toString(), classNames: [ID_ITEM_CSS] }),
      /* build('span', { text: context.volume.toString(), classNames: [ITEM_CSS] }), */
      build('span', { text: context.description, classNames: [ITEM_CSS] })
    )
  );

const ul = build('ul', { classNames: [LIST_CONTAINER_CSS] });
const [virtualisedListEelement, load] = virtualise<Context>({
  containerElement: ul,
  containerHeight: 810,
  rowBuilder: buildItem,
  rowHeight: 30
});

const getItemCount = (len: number | undefined) => {
  const itemText = len === 1 ? 'item' : 'items';
  const lenValue = len === undefined ? 0 : len;
  return `${lenValue.toLocaleString()} ${itemText}`;
};

const itemCounter = build('span', { text: getItemCount(data?.length), style: 'margin-left: 10px; margin-top: 12px' });

let timeoutId: number = 0;
const filterTextChanged = (element: HTMLInputElement) => {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    const filteredData = data.filter((context) => context.description.toLowerCase().includes(element.value.toLowerCase()));
    itemCounter.innerText = getItemCount(filteredData.length);
    load(filteredData);
  }, DEBOUNCE_INTERVAL);
};

const input = textInput(filterTextChanged, '', '', [FILTER_INPUT_BOX_CSS]);

const inputControl = html(
  build('div', { style: 'display: flex; align-items: center;' }),
  input,
  itemCounter
);

html(document.querySelector<HTMLElement>('#app')!, inputControl, virtualisedListEelement);

input.focus();

load(data);

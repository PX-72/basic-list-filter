import { html, build, textInput } from './utils/dom-helper.js';
import { getContexts, Context } from './api/context-api.js';

const DATA_ID_PROPERTY = 'data-id';
const DEBOUNCE_INTERVAL = 300;
const DATA_SIZE = 10000;

const UL_STYLE = `
  margin: 20px 0 0 0;
  padding: 10px 0 0 0;
  border-top: 1px solid gray;
  list-style-type: none;
  min-height: 300px; 
  max-height: 1100px; 
  overflow-y: auto;
`;

const LI_STYLE = `
  border-bottom: 1px solid #14213d;
  display: block;
`;

const ITEM_CONTAINER = `
  didsplay: flex;
  flex-direction: row;
  margin: 5px 0;
`;

const ITEM = `
  margin-left: 25px;
`;

const ID_ITEM = `
  ${ITEM}
  width: 30px;
  display: inline-block;
`;

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

const data: Context[] = await getContexts(DATA_SIZE);

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
    for (const li of ul.querySelectorAll('li')) {
      if (mustShowAll || matchedIds.has(li.getAttribute(DATA_ID_PROPERTY))) {
        li.style.display = 'block';
      } else {
        li.style.display = 'none';
      }
    }
  });
};

const ul = build('ul', { style: UL_STYLE });

let timeoutId: number = 0;
const filterTextChanged = (element: HTMLInputElement) => {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => filter(element.value, ul), DEBOUNCE_INTERVAL);
};

const input = textInput(filterTextChanged, '', INPUT_STYLE);

const buildItem = (context: Context): HTMLElement =>
  html(
    build('li', { style: LI_STYLE, attributes: { [DATA_ID_PROPERTY]: context.id.toString() } }),
    html(
      build('div', { style: ITEM_CONTAINER }),
      build('span', { text: context.id.toString(), style: ID_ITEM }),
      build('span', { text: context.volume.toString(), style: ITEM }),
      build('span', { text: context.description, style: ITEM })
    )
  );

const createList = (contexts: Context[]): HTMLElement => html(ul, ...data.map((d) => buildItem(d)));

html(document.querySelector<HTMLElement>('#app')!, input, createList(data));

input.focus();

import { html, build } from './utils/dom-helper.js';
import { getContexts, Context } from './api/context-api.js';

const data: Context[] = await getContexts(1000);

const filterTextChanged = (e: HTMLInputElement) => {
  console.log(e.value);
};

const input = build<HTMLInputElement>('input', {
  attributes: { type: 'text' },
  eventType: 'input',
  eventCallback: filterTextChanged,
});

console.log(data[0]);

html(document.querySelector<HTMLElement>('#app')!, input);

import { html, textInput } from './utils/dom-helper.js';
import { getContexts, Context } from './api/context-api.js';

const data: Context[] = await getContexts(1000);

const filterTextChanged = (e: HTMLInputElement) => {
  console.log(e.value);
};

const input = textInput(filterTextChanged);

console.log(data[0]);

html(document.querySelector<HTMLElement>('#app')!, input);

export type HtmlElementBuilderOptions<T extends HTMLElement> = {
  text?: string;
  style?: string;
  classNames?: string[];
  visible?: boolean;
  attributes?: object;
  eventType?: string;
  eventCallback?: (e: T) => void;
};

export type CssSelector = {
  selectorName: string;
  selectorBody: string;
};

export const build = <T extends HTMLElement>(type: string, options: HtmlElementBuilderOptions<T> = {}): T => {
  const { text, style = '', classNames = [], visible = true, attributes = {}, eventType, eventCallback } = options;

  const element = document.createElement(type) as T;
  if (text) element.innerText = text;

  if (!visible) {
    element.style.display = 'none';
    return element;
  }

  if (style) {
    element.setAttribute('style', style.replace(/\n/g, '').trim());
  }

  classNames.forEach(c => element.setAttribute('class', c.replace(/^\./,'')));

  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }

  if (eventType && eventCallback) {
    element.addEventListener(eventType, (e: Event) => eventCallback(e.target as T));
  }

  return element;
};

export const html = (parent: HTMLElement, ...children: Array<HTMLElement | DocumentFragment>): HTMLElement => {
  for (const childElement of children) parent.appendChild(childElement);
  return parent;
};

export const fragment = (...elements: HTMLElement[]): DocumentFragment => {
  const htmlFragment = document.createDocumentFragment();
  for (const childElement of elements) htmlFragment.appendChild(childElement);
  return htmlFragment;
};

export const toggleVisibility = (elements: HTMLElement[] = [], visibleStyle = 'block'): void => {
  elements.forEach((element) => {
    element.style.display = element.style.display === 'none' ? visibleStyle : 'none';
  });
};

export const button = (text: string, onclick: () => void, style: string = '', classNames = []): HTMLButtonElement =>
  build<HTMLButtonElement>('button', {
    text: text,
    style: style,
    classNames: classNames,
    eventType: 'click',
    eventCallback: () => onclick()
  });

export const textInput = (
  inputChangeCallback: (e: HTMLInputElement) => void,
  initValue: string = '',
  style: string = '',
  classNames = []
): HTMLInputElement =>
  build<HTMLInputElement>('input', {
    attributes: { type: 'text', value: initValue },
    style: style,
    classNames: classNames,
    eventType: 'input',
    eventCallback: inputChangeCallback
  });

export const createCssSelector = (name: string, body: string): CssSelector => ({
  selectorName: name,
  selectorBody: body
});

export const appendGlobalStyles = (...selectors: CssSelector[]): void => {
  if (selectors.length === 0) return;

  const list = selectors.map((s) => ` ${s.selectorName} {${s.selectorBody}} `);
  document.head.insertAdjacentHTML('beforeend', `<style>${list.join('\n\n')}</style>`);
};

export type HtmlElementBuilderOptions<T extends HTMLElement> = {
  text?: string;
  style?: string;
  className?: string;
  visible?: boolean;
  attributes?: object;
  eventType?: string;
  eventCallback?: (e: T) => void;
};

export const build = <T extends HTMLElement>(type: string, options: HtmlElementBuilderOptions<T> = {}): T => {
  const { text, style = '', className = '', visible = true, attributes = {}, eventType, eventCallback } = options;

  const element = document.createElement(type) as T;
  if (text) element.innerText = text;

  if (!visible) {
    element.style.display = 'none';
    return element;
  }

  if (style) {
    element.setAttribute('style', style.replace(/\n/g, '').trim());
  }

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

export const button = (text: string, onclick: () => void, style: string = '', className = ''): HTMLButtonElement => (
  build<HTMLButtonElement>('button', {
    text: text,
    style: style,
    className: className,
    eventType: 'click',
    eventCallback: () => onclick()
  })
);

export const textInput = (inputChangeCallback: (e: HTMLInputElement) => void, initValue: string = '', style: string = '', className = ''): HTMLInputElement => (
  build<HTMLInputElement>('input', {
    attributes: { type: 'text', value: initValue },
    style: style,
    className: className,
    eventType: 'input',
    eventCallback: inputChangeCallback,
  })
);

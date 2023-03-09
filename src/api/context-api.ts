import { words } from '../data/words.js';

export type Context = {
  name: string;
  description: string;
  accepted: boolean;
  volume: number;
};

const wordLen = words.length;

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomWord = (): string => words[randomInt(0, wordLen - 1)];
const getRandomBoolean = (): boolean => Boolean(randomInt(0, 1));
const getWords = (length: number): string => [...Array(length)].map(getRandomWord).join(' ');

const delay = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

export const getContexts = async (numberOfContexts: number, time: number = 1000): Promise<Context[]> => {
  await delay(time);

  return [...Array(numberOfContexts)].map(() => ({
    name: getRandomWord(),
    description: getWords(randomInt(3, 7)),
    accepted: getRandomBoolean(),
    volume: randomInt(10000, 99999)
  }));
};

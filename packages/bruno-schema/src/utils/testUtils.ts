import { customAlphabet } from 'nanoid';
import { expect } from '@jest/globals';

const urlAlphabet = 'useandom26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict';

export const uuid = (): string => {
  const customNanoId = customAlphabet(urlAlphabet, 21);
  return customNanoId();
};

export const validationErrorWithMessages = (...errors: string[]): any => {
  return expect.objectContaining({
    errors
  });
};

export { expect };

import { expect } from '@jest/globals';
import { uuid, validationErrorWithMessages } from '../utils/testUtils';
import { itemSchema } from './index';

describe('Item Schema Validation', () => {
  it('item schema must validate successfully - simple items', async () => {
    /** @type {{ uid: string; name: string; type: 'folder'; tags: readonly string[] }} */
    const item = {
      uid: uuid(),
      name: 'A Folder',
      type: 'folder',
      tags: ['smoke-test']
    };

    const isValid = await itemSchema.validate(item);
    expect(isValid).toBeTruthy();
  });

  it('item schema must throw an error if name is missing', async () => {
    /** @type {{ uid: string; type: 'folder' }} */
    const item = {
      uid: uuid(),
      type: 'folder'
    };

    await expect(itemSchema.validate(item)).rejects.toEqual(validationErrorWithMessages('name is required'));
  });

  it('item schema must throw an error if name is empty', async () => {
    /** @type {{ uid: string; name: string; type: 'folder' }} */
    const item = {
      uid: uuid(),
      name: '',
      type: 'folder'
    };

    await expect(itemSchema.validate(item)).rejects.toEqual(
      validationErrorWithMessages('name must be at least 1 character')
    );
  });

  it('item schema must throw an error if request is not present when item-type is http-request', async () => {
    /** @type {{ uid: string; name: string; type: 'http-request' }} */
    const item = {
      uid: uuid(),
      name: 'Get Users',
      type: 'http-request'
    };

    await expect(itemSchema.validate(item)).rejects.toEqual(
      validationErrorWithMessages('request is required when item-type is request')
    );
  });

  it('item schema must throw an error if request is not present when item-type is graphql-request', async () => {
    /** @type {{ uid: string; name: string; type: 'graphql-request' }} */
    const item = {
      uid: uuid(),
      name: 'Get Users',
      type: 'graphql-request'
    };

    await expect(itemSchema.validate(item)).rejects.toEqual(
      validationErrorWithMessages('request is required when item-type is request')
    );
  });
});

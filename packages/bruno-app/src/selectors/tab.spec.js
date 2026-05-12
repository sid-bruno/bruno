import { getTabUidForItem, isTabForItemActive, isTabForItemPresent } from './tab';

describe('tab selectors', () => {
  const baseState = {
    tabs: {
      activeTabUid: null,
      tabs: []
    }
  };

  it('matches request tab by uid in collection scope', () => {
    const state = {
      ...baseState,
      tabs: {
        ...baseState.tabs,
        tabs: [
          {
            uid: 'request-1',
            type: 'http-request',
            pathname: '/c/req.bru',
            collectionUid: 'c1'
          }
        ]
      }
    };

    const uidSelector = getTabUidForItem({ itemUid: 'request-1', itemPathname: '/c/other.bru', collectionUid: 'c1' });
    const presentSelector = isTabForItemPresent({ itemUid: 'request-1', itemPathname: '/c/other.bru', collectionUid: 'c1' });

    expect(uidSelector(state)).toBe('request-1');
    expect(presentSelector(state)).toBe(true);
  });

  it('matches request tab by pathname fallback for non-example tabs', () => {
    const state = {
      ...baseState,
      tabs: {
        ...baseState.tabs,
        tabs: [
          {
            uid: 'request-1',
            type: 'http-request',
            pathname: '/c/req.bru',
            collectionUid: 'c1'
          }
        ]
      }
    };

    const uidSelector = getTabUidForItem({ itemUid: 'missing-uid', itemPathname: '/c/req.bru', collectionUid: 'c1' });
    const presentSelector = isTabForItemPresent({ itemUid: 'missing-uid', itemPathname: '/c/req.bru', collectionUid: 'c1' });

    expect(uidSelector(state)).toBe('request-1');
    expect(presentSelector(state)).toBe(true);
  });

  it('does not resolve request tab uid from response-example pathname fallback', () => {
    const state = {
      ...baseState,
      tabs: {
        ...baseState.tabs,
        tabs: [
          {
            uid: 'example-1',
            type: 'response-example',
            pathname: '/c/req.bru',
            collectionUid: 'c1'
          }
        ]
      }
    };

    const selector = getTabUidForItem({ itemUid: 'request-1', itemPathname: '/c/req.bru', collectionUid: 'c1' });
    expect(selector(state)).toBeNull();
  });

  it('does not mark request active when only response-example tab is active on same pathname', () => {
    const state = {
      ...baseState,
      tabs: {
        activeTabUid: 'example-1',
        tabs: [
          {
            uid: 'example-1',
            type: 'response-example',
            pathname: '/c/req.bru',
            collectionUid: 'c1'
          }
        ]
      }
    };

    const selector = isTabForItemActive({ itemUid: 'request-1', itemPathname: '/c/req.bru', collectionUid: 'c1' });
    expect(selector(state)).toBe(false);
  });

  it('does not match tabs from a different collection scope', () => {
    const state = {
      ...baseState,
      tabs: {
        activeTabUid: 'request-1',
        tabs: [
          {
            uid: 'request-1',
            type: 'http-request',
            pathname: '/c/req.bru',
            collectionUid: 'c2'
          }
        ]
      }
    };

    const activeSelector = isTabForItemActive({ itemUid: 'request-1', itemPathname: '/c/req.bru', collectionUid: 'c1' });
    const presentSelector = isTabForItemPresent({ itemUid: 'request-1', itemPathname: '/c/req.bru', collectionUid: 'c1' });
    const uidSelector = getTabUidForItem({ itemUid: 'request-1', itemPathname: '/c/req.bru', collectionUid: 'c1' });

    expect(activeSelector(state)).toBe(false);
    expect(presentSelector(state)).toBe(false);
    expect(uidSelector(state)).toBeNull();
  });
});

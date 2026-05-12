import { createSelector } from '@reduxjs/toolkit';

const isPathMatchableTab = (tab) => tab.type !== 'response-example';

const isTabInCollectionScope = (tab, collectionUid) => {
  if (!collectionUid) {
    return true;
  }

  return tab.collectionUid === collectionUid;
};

const isUidMatch = (tab, itemUid) => tab.uid === itemUid;

const isPathnameMatch = (tab, itemPathname) => {
  if (!itemPathname || !isPathMatchableTab(tab)) {
    return false;
  }

  return tab.pathname === itemPathname;
};

const isTabMatchForItem = (tab, { itemUid, itemPathname, collectionUid }) => {
  if (!isTabInCollectionScope(tab, collectionUid)) {
    return false;
  }

  return isUidMatch(tab, itemUid) || isPathnameMatch(tab, itemPathname);
};

export const getTabUidForItem = ({ itemUid, itemPathname, collectionUid }) => createSelector([
  (state) => state.tabs.tabs
], (tabs) => {
  const tabByUid = tabs.find((tab) => isTabInCollectionScope(tab, collectionUid) && isUidMatch(tab, itemUid));
  if (tabByUid) {
    return tabByUid.uid;
  }

  const tabByPathname = tabs.find((tab) => isTabInCollectionScope(tab, collectionUid) && isPathnameMatch(tab, itemPathname));
  return tabByPathname?.uid || null;
});

export const isTabForItemActive = ({ itemUid, itemPathname, collectionUid }) => createSelector([
  (state) => state.tabs?.activeTabUid,
  (state) => state.tabs.tabs
], (activeTabUid, tabs) => {
  if (!activeTabUid) {
    return false;
  }

  const activeTab = tabs.find((tab) => tab.uid === activeTabUid);
  if (!activeTab) {
    return false;
  }

  return isTabMatchForItem(activeTab, { itemUid, itemPathname, collectionUid });
});

export const isTabForItemPresent = ({ itemUid, itemPathname, collectionUid }) => createSelector([
  (state) => state.tabs.tabs
], (tabs) => tabs.some((tab) => isTabMatchForItem(tab, { itemUid, itemPathname, collectionUid })));

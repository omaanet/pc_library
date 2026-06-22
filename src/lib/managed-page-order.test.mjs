import assert from 'node:assert/strict';
import test from 'node:test';

import { getVisibleManagedPages, sortManagedPages } from './managed-page-order.ts';

const pages = [
    { label: 'Power 2', accessLevel: 2, displayOrder: 2 },
    { label: 'Registered 2', accessLevel: 0, displayOrder: 2 },
    { label: 'Power 1', accessLevel: 2, displayOrder: 1 },
    { label: 'Registered 1', accessLevel: 0, displayOrder: 1 },
];

test('managed pages sort by level and then display order', () => {
    assert.deepEqual(sortManagedPages(pages).map((page) => page.label), [
        'Registered 1', 'Registered 2', 'Power 1', 'Power 2',
    ]);
});

test('visible managed pages exclude access levels above the user', () => {
    assert.deepEqual(getVisibleManagedPages(pages, 0).map((page) => page.label), [
        'Registered 1', 'Registered 2',
    ]);
    assert.equal(getVisibleManagedPages(pages, 2).length, pages.length);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
    BOOK_SORT_PRESETS,
    isBookSortPreset,
    resolveBookSortPreset,
} from './book-sort.ts';

test('main library preset excludes audio and uses manual order before publication date', () => {
    const clauses = resolveBookSortPreset(BOOK_SORT_PRESETS.MAIN_LIBRARY);

    assert.deepEqual(clauses, [
        ['display_order', 'ASC'],
        ['publishing_date', 'DESC'],
    ]);
    assert.equal(clauses.some(([column]) => column === 'has_audio'), false);
});

test('only known sort presets are accepted', () => {
    assert.equal(isBookSortPreset('main-library'), true);
    assert.equal(isBookSortPreset('has-audio'), false);
    assert.equal(isBookSortPreset(null), false);
});

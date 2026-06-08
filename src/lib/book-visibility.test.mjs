import assert from 'node:assert/strict';
import test from 'node:test';

import {
    canAccessAudio,
    canAccessBook,
    canAccessReading,
    getBookPresentationMode,
    getBulkVisibilityUpdate,
    getMasterVisibilityState,
    isAudioAvailable,
    isBookAvailable,
    normalizeBookVisibility,
} from './book-visibility.ts';

const states = {
    both: { hasAudio: true, isReadingVisible: true, isAudioVisible: true },
    reading: { hasAudio: true, isReadingVisible: true, isAudioVisible: false },
    audio: { hasAudio: true, isReadingVisible: false, isAudioVisible: true },
    neither: { hasAudio: true, isReadingVisible: false, isAudioVisible: false },
    noAudio: { hasAudio: false, isReadingVisible: true, isAudioVisible: true },
};

test('availability follows the four format visibility combinations', () => {
    assert.equal(isBookAvailable(states.both), true);
    assert.equal(isBookAvailable(states.reading), true);
    assert.equal(isBookAvailable(states.audio), true);
    assert.equal(isBookAvailable(states.neither), false);
    assert.equal(isAudioAvailable(states.noAudio), false);
});

test('presentation mode follows effective format visibility', () => {
    assert.equal(getBookPresentationMode(states.both), 'reading-and-audio');
    assert.equal(getBookPresentationMode(states.reading), 'reading-only');
    assert.equal(getBookPresentationMode(states.audio), 'audio-only');
    assert.equal(getBookPresentationMode(states.neither), 'unavailable');
    assert.equal(getBookPresentationMode(states.noAudio), 'reading-only');
});

test('master visibility is checked, unchecked, or indeterminate', () => {
    assert.equal(getMasterVisibilityState(states.both), true);
    assert.equal(getMasterVisibilityState(states.neither), false);
    assert.equal(getMasterVisibilityState(states.reading), 'indeterminate');
    assert.equal(getMasterVisibilityState(states.audio), 'indeterminate');
    assert.equal(getMasterVisibilityState(states.noAudio), true);
});

test('master click hides all from checked and shows all from mixed or unchecked', () => {
    assert.deepEqual(getBulkVisibilityUpdate(states.both), {
        isReadingVisible: false,
        isAudioVisible: false,
    });
    assert.deepEqual(getBulkVisibilityUpdate(states.reading), {
        isReadingVisible: true,
        isAudioVisible: true,
    });
    assert.deepEqual(getBulkVisibilityUpdate(states.neither), {
        isReadingVisible: true,
        isAudioVisible: true,
    });
    assert.deepEqual(getBulkVisibilityUpdate(states.noAudio), {
        isReadingVisible: false,
        isAudioVisible: false,
    });
});

test('legacy visibility maps to both formats while new audio defaults hidden', () => {
    assert.deepEqual(
        normalizeBookVisibility(
            { hasAudio: true, isVisible: 1 },
            { isReadingVisible: true, isAudioVisible: false }
        ),
        { isReadingVisible: true, isAudioVisible: true }
    );
    assert.deepEqual(
        normalizeBookVisibility(
            { hasAudio: true },
            { isReadingVisible: true, isAudioVisible: false }
        ),
        { isReadingVisible: true, isAudioVisible: false }
    );
    assert.deepEqual(
        normalizeBookVisibility(
            { hasAudio: false, isAudioVisible: true },
            { isReadingVisible: true, isAudioVisible: true }
        ),
        { isReadingVisible: true, isAudioVisible: false }
    );
});

test('admins bypass hidden format checks', () => {
    assert.equal(canAccessReading(states.neither), false);
    assert.equal(canAccessAudio(states.neither), false);
    assert.equal(canAccessBook(states.neither), false);
    assert.equal(canAccessReading(states.neither, true), true);
    assert.equal(canAccessAudio(states.neither, true), true);
    assert.equal(canAccessBook(states.neither, true), true);
});

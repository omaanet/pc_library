import assert from 'node:assert/strict';
import test from 'node:test';
import { bookFormSchema, getBookFormValues, getBookFormErrorMessages } from './book-form-values.ts';

const book = {
    id: 'book-1746324080859', title: 'La Ragazza del Carillon',
    coverImage: 'copertina-la-ragazza-del-carillon.jpg',
    publishingDate: '2026-06-10T22:00:00.000Z', summary: '',
    hasAudio: false, audioLength: null, extract: '', rating: null,
    isPreview: 1, isNew: false, isVisible: 0,
    isReadingVisible: false, isAudioVisible: false, displayOrder: 201,
    pagesCount: 14, mediaId: 'OUBwb9ttqKASxQnb8EnKnIszb301VrROQ',
    mediaTitle: 'La Ragazza del Carillon', mediaUid: '1',
    previewPlacement: 'right', replaceFirstPageWithCopyrightOverride: null,
};

test('reported book validates without touching the Preview Book switch', () => {
    const values = getBookFormValues(book);
    const result = bookFormSchema.safeParse(values);
    assert.equal(result.success, true, JSON.stringify(result.error?.issues));
    assert.equal(result.data.isPreview, true);
    assert.equal(result.data.isReadingVisible, false);
    assert.equal(result.data.replaceFirstPageWithCopyrightOverride, null);
    assert.equal(result.data.mediaId, book.mediaId);
    assert.equal(result.data.publishingDate.toISOString(), book.publishingDate);
    // The public form schema stays strict; only initialization handles DB flags.
    assert.equal(bookFormSchema.safeParse({ ...values, isPreview: 1 }).success, false);
});

test('numeric and boolean flags normalize consistently, including nested defaults', () => {
    for (const value of [0, 1, false, true]) {
        const values = getBookFormValues({ ...book, hasAudio: value, isPreview: value,
            isNew: value, isReadingVisible: value, isAudioVisible: value,
            replaceFirstPageWithCopyrightOverride: value,
            audiobook: { introAudioOverride: value, introAudioTitle: 'Intro', introAudioId: 'intro-id' },
        });
        for (const field of ['hasAudio', 'isPreview', 'isNew', 'isReadingVisible', 'isAudioVisible', 'replaceFirstPageWithCopyrightOverride']) {
            assert.equal(values[field], Boolean(value), field);
        }
        assert.equal(values.audiobook.introAudioOverride, Boolean(value));
        assert.equal(bookFormSchema.safeParse(values).success, true);
    }
    assert.equal(getBookFormValues({ ...book, hasAudio: 0, isAudioVisible: 1 }).isAudioVisible, false);
});

test('missing audiobook and legacy visibility do not mutate the input book', () => {
    const original = Object.freeze({ ...book, hasAudio: true,
        isVisible: 1, isReadingVisible: undefined, isAudioVisible: undefined });
    const first = getBookFormValues(original);
    assert.equal(first.isReadingVisible, true);
    assert.equal(first.isAudioVisible, true);
    assert.deepEqual(first.audiobook, { mediaId: null, introAudioOverride: false, introAudioTitle: null, introAudioId: null });
    assert.equal(original.audiobook, undefined);
    first.audiobook.mediaId = 'edited';
    assert.equal(getBookFormValues(original).audiobook.mediaId, null);
    assert.equal(getBookFormValues().isReadingVisible, true);
    assert.equal(getBookFormValues().isAudioVisible, false);
    assert.equal(getBookFormValues().coverImage, '@placeholder');
});

test('validation summaries include nested hidden errors and never traverse refs', () => {
    const ref = {};
    ref.circular = ref;
    assert.deepEqual(getBookFormErrorMessages({
        title: { message: 'Title is required', type: 'too_small', ref },
        audiobook: { introAudioId: { message: 'IntroAudioID is required', ref } },
        isPreview: { message: 'Expected boolean, received number', ref },
    }), ['Title is required', 'IntroAudioID is required', 'Expected boolean, received number']);
    assert.deepEqual(getBookFormErrorMessages({}), []);
});

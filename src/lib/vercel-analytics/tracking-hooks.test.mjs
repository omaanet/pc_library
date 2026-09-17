import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as tracking from './tracking.ts';

// A small hook lifecycle harness exercises the real hooks without a browser SDK
// or sending analytics. Refs/memo slots survive rerenders; effects can replay.
function harness(enabled = true) {
    const slots = []; let index = 0; let effects = [];
    const events = []; const saved = new Map();
    const react = {
        useRef(value) { const slot = index++; return slots[slot] ||= { current: value }; },
        useEffect(effect) { index++; effects.push(effect); },
        useMemo(factory, deps) {
            const slot = index++;
            if (!slots[slot] || deps.some((value, i) => value !== slots[slot].deps[i])) slots[slot] = { value: factory(), deps };
            return slots[slot].value;
        },
    };
    const source = fs.readFileSync(new URL('../../hooks/use-vercel-book-tracking.ts', import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const mod = { exports: {} };
    vm.runInNewContext(compiled, {
        module: mod, exports: mod.exports,
        process: { env: { NEXT_PUBLIC_VERCEL_CUSTOM_EVENTS_ENABLED: String(enabled) } },
        window: { sessionStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) } },
        require: name => name === 'react' ? react : name === '@vercel/analytics' ? { track: (name, data) => events.push({ name, data }) } : tracking,
    });
    return {
        hooks: mod.exports, events, saved,
        render(fn) { index = 0; effects = []; const result = fn(mod.exports); effects.forEach(effect => effect()); return result; },
        replayEffects() { effects.forEach(effect => effect()); },
    };
}
test('modal rerenders and effect replay do not duplicate views; reopening does', () => {
    const h = harness();
    h.render(hooks => hooks.useBookViewTracking('book', true));
    h.replayEffects(); h.render(hooks => hooks.useBookViewTracking('book', true));
    assert.equal(h.events.length, 1);
    h.render(hooks => hooks.useBookViewTracking('book', false));
    h.render(hooks => hooks.useBookViewTracking('book', true));
    assert.equal(h.events.length, 2);
    h.render(hooks => hooks.useBookViewTracking('another', true));
    assert.equal(h.events.length, 3);
});
test('reader ignores placeholders and failed images; successful direct opens count once', () => {
    const h = harness();
    let loaded = h.render(hooks => hooks.useReaderOpenTracking('direct'));
    loaded({ currentSrc: 'data:image/svg+xml,placeholder', naturalWidth: 1 });
    loaded({ currentSrc: 'https://cdn.example/page.png', naturalWidth: 0 });
    assert.equal(h.events.length, 0);
    loaded({ currentSrc: 'https://cdn.example/page.png', naturalWidth: 600 });
    loaded = h.render(hooks => hooks.useReaderOpenTracking('direct'));
    loaded({ currentSrc: 'https://cdn.example/page2.png', naturalWidth: 600 });
    assert.deepEqual(h.events.map(event => event.name), ['reader_open']);
});
test('Hobby disables events and attribution writes, including actual reader/audio callbacks', () => {
    const h = harness(false);
    h.render(hooks => hooks.useBookViewTracking('book', true));
    const audio = harness(false);
    const tracker = audio.render(hooks => hooks.useAudioAnalytics('book', 'media', 'library'));
    tracker.start('main'); tracker.coverage('main', 90, 100);
    assert.equal(h.events.length + audio.events.length, 0);
    assert.equal(h.saved.size, 0);
    const reader = harness(false);
    reader.render(hooks => hooks.useReaderOpenTracking('book'))({ currentSrc: 'https://cdn.example/page.png', naturalWidth: 600 });
    assert.equal(reader.events.length, 0);
});
test('promo previews suppress events; source changes start a new measurement', () => {
    const h = harness();
    let audio = h.render(hooks => hooks.useAudioAnalytics('book', 'media', 'promo', true));
    audio.start('main'); audio.coverage('main', 90, 100); assert.equal(h.events.length, 0);
    audio = h.render(hooks => hooks.useAudioAnalytics('book', 'media', 'promo', false));
    audio.start('main'); audio.coverage('main', 50, 100);
    audio = h.render(hooks => hooks.useAudioAnalytics('book', 'media', 'promo', false));
    audio.start('main'); audio.coverage('main', 60, 100); assert.equal(h.events.length, 2);
    audio = h.render(hooks => hooks.useAudioAnalytics('book', 'other-media', 'promo', false));
    audio.start('main'); assert.equal(h.events.length, 3);
});

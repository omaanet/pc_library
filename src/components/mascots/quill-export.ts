/**
 * Serialize the current visual state of a paused QuillSprite to a
 * self-contained SVG string.
 *
 * The live sprite uses CSS keyframe animations on multiple groups. When
 * paused via `animation-play-state: paused`, the *visual* state is correct
 * but the underlying markup still references the keyframes by name and
 * relies on the embedded <style> + CSS variables (`--text-quill`,
 * `--gold-main`, `--qdur-scale`). To make a standalone SVG, we walk the
 * live tree and bake the resolved values onto a clone:
 *  - `transform` and `transform-origin` (the mid-animation matrix)
 *  - `stroke`, `fill`, `opacity` (resolves `var(--…)` references)
 * Then we strip the <style> block and any crossfade overlay group.
 */

function bakeNode(live: Element, clone: Element): void {
    if (live instanceof SVGElement || live instanceof HTMLElement) {
        const cs = getComputedStyle(live);
        const target = clone as SVGElement;

        if (cs.transform && cs.transform !== 'none') {
            target.style.transform = cs.transform;
            if (cs.transformOrigin) target.style.transformOrigin = cs.transformOrigin;
        }
        if (cs.opacity && cs.opacity !== '1') target.style.opacity = cs.opacity;

        // Resolve stroke/fill so var(--…) references survive outside the app.
        if (cs.stroke && cs.stroke !== 'none' && cs.stroke !== 'rgb(0, 0, 0)') {
            target.style.stroke = cs.stroke;
        }
        if (cs.fill && cs.fill !== 'none' && cs.fill !== 'rgb(0, 0, 0)') {
            target.style.fill = cs.fill;
        }
        if (cs.strokeWidth) target.style.strokeWidth = cs.strokeWidth;
    }

    const liveChildren = Array.from(live.children);
    const cloneChildren = Array.from(clone.children);
    for (let i = 0; i < liveChildren.length; i++) {
        const lc = liveChildren[i];
        const cc = cloneChildren[i];
        if (cc) bakeNode(lc, cc);
    }
}

export function serializePausedQuill(liveSvg: SVGSVGElement): string {
    const clone = liveSvg.cloneNode(true) as SVGSVGElement;

    // Drop the embedded <style> block — animations are now baked inline.
    clone.querySelectorAll('style').forEach((s) => s.remove());

    // Drop crossfade overlay groups (transient pose-change layer).
    clone.querySelectorAll('.qp-crossfade-out, .qp-crossfade-in').forEach((g) => {
        if (g.classList.contains('qp-crossfade-out')) g.remove();
        else g.classList.remove('qp-crossfade-in');
    });

    bakeNode(liveSvg, clone);

    // Ensure standalone SVG renders correctly outside the document.
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // Strip class hooks now that they no longer drive styling.
    clone.querySelectorAll('[class]').forEach((el) => el.removeAttribute('class'));
    clone.removeAttribute('class');

    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    return xml + new XMLSerializer().serializeToString(clone);
}

export function downloadSvg(svg: string, filename = 'quill-pose.svg'): void {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

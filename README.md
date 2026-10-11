# Ivan's personal website

A static portfolio and canvas platform game. No build step is required.

## Preview

Open `personal.html` (home) or `index.html` (game) in a modern browser. For an HTTP preview, run `python3 -m http.server 8080` from this directory, then open http://localhost:8080.

## Input and layout

- Game: press W, A, or D to start playing immediately. A/D or left/right arrows to move; W, up arrow, or Space to jump. Press again for a second jump with randomized strength, matching the original game’s 10–17 range relative to a first jump of 14. The two dots show jumps remaining.
- Touch: hold either direction button and tap Jump, using two fingers simultaneously. Touch controls appear on devices with any coarse pointer, including hybrid laptops. Keyboard-only devices show W/A/D guidance even in a narrow window.
- Escape pauses or resumes. Switching tabs or windows pauses automatically. Press a movement/jump key or use Resume to continue.
- Navigation supports Tab and Enter, visible focus outlines, and a skip link. Social links open in a new tab.
- Layout follows viewport size; input capabilities use CSS media queries, not device or browser names. Rotation resizes rendering without changing game physics.
- Best score is saved in browser storage when available. It can differ between file previews and a hosted site.

## Files

- `game-core.js`: simulation and procedural platforms, independent of the DOM.
- `game.js`: rendering, fixed-step loop, keyboard/pointer input, and game UI.
- `game.css`: game layout and touch controls.
- `personal.css`, `nav.css`: portfolio styles and shared navigation.

## Tests

Run `npm test` with Node.js 18 or newer. Tests cover jump limits, frame-rate-independent simulation, collision crossings, scoring, platform bounds, and restart state. Browser checks should include small portrait screens, landscape phones, laptops, hybrid touch/keyboard input, pointer cancellation, focus navigation, and tab switching. Real-device testing remains useful, especially on mobile Safari.

Deploy the HTML, CSS, JavaScript, `images` directory together to any static host. The Projects page has been removed; Home and Game remain at their existing URLs.

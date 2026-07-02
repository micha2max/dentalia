// Vorher/Nachher comparison slider — progressive enhancement over a native
// <input type=range> (keyboard + pointer for free). Clip position flows
// through the --ba custom property; without JS the block stays a 50/50 split.
document.querySelectorAll('.ba').forEach((ba) => {
  const range = ba.querySelector('.ba-range');
  if (!range) return;
  const set = () => ba.style.setProperty('--ba', `${range.value}%`);
  range.addEventListener('input', set);
  set();
});

/** MapLibre positions the outer marker. The minibus and labels share one anchored face. */
export function createBusPin(fleet: string) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'bus-pin';
  el.setAttribute('aria-label', `Bus ${fleet}`);
  el.innerHTML = `<span class="bus-face">
    <svg class="bus-mark" viewBox="0 0 44 28" aria-hidden="true">
      <path fill="#0b1b3b" d="M4 8a5 5 0 0 1 5-5h21c3 0 5 1 7 4l4 5v8H4Z"/>
      <path fill="#a8ddff" d="M8 7h8v6H8zm10 0h8v6h-8zm11 0h2l5 6h-7z"/>
      <path fill="#1f5bff" d="M4 15h37v3H4z"/>
      <circle cx="12" cy="21" r="4" fill="#0b1b3b" stroke="#fff" stroke-width="2"/>
      <circle cx="33" cy="21" r="4" fill="#0b1b3b" stroke="#fff" stroke-width="2"/>
    </svg>
    <span class="bus-num"></span>
    <span class="heading-arrow" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M8 2 13 13 8 10 3 13Z" fill="currentColor"/></svg></span>
    <span class="bus-aboard" aria-hidden="true">YOU'RE ON</span>
  </span>`;
  el.querySelector('.bus-num')!.textContent = fleet;
  const arrow = el.querySelector<HTMLElement>('.heading-arrow')!;
  return { element: el, arrow };
}

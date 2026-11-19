/** Option B. Change these colours, or the paths below, to restyle every bus pin. */
export const BUS_PIN = {
  face: '#ffffff',
  ink: '#0B1B3B',
  badge: '#1F5BFF',
  arrow: '#1F5BFF',
  width: 42,
  height: 48,
};

/** White teardrop, navy HiAce side view, blue number, heading badge. */
export function createBusPin(fleet: string) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'bus-pin';
  el.setAttribute('aria-label', `Bus ${fleet}`);
  el.innerHTML = `<svg class="bus-mark" viewBox="0 0 64 74" aria-hidden="true">
    <path fill="${BUS_PIN.face}" d="M32 2C47.6 2 58 12.6 58 27.6 58 40.2 44.2 54.6 32 72.4 19.8 54.6 6 40.2 6 27.6 6 12.6 16.4 2 32 2z"/>
    <g transform="translate(32 29) scale(1.22) translate(-32 -29)">
      <path fill="${BUS_PIN.ink}" d="M14 31.2c.2-4.6 3.2-7.4 8.2-8.2l6.6-1.4c1.6-.4 2.6-1.2 4-2.6 1-1 2-1.4 3.4-1.4h7.2c2.6 0 4.4 1.2 5.6 3.2l3.4 5.2c.6 1 .8 1.8.6 2.8l-.6 2.4c-.4 1.6-1.8 2.6-3.4 2.6H17.2c-1.8 0-3.2-1.2-3.2-2.6z"/>
      <path fill="${BUS_PIN.face}" d="M18.2 24.6h7.2v5.2h-7.2zM27.2 24.6h6.4v5.2h-6.4zM35.2 24.8l6.6.2 2.6 4.6H35.2z"/>
      <path stroke="${BUS_PIN.face}" stroke-width="1.2" d="M34.6 24.8v10.4"/>
      <circle cx="22" cy="35.6" r="3.5" fill="${BUS_PIN.ink}"/>
      <circle cx="22" cy="35.6" r="1.4" fill="${BUS_PIN.face}"/>
      <circle cx="43.5" cy="35.6" r="3.5" fill="${BUS_PIN.ink}"/>
      <circle cx="43.5" cy="35.6" r="1.4" fill="${BUS_PIN.face}"/>
    </g>
  </svg>
  <span class="bus-num">${fleet}</span>`;
  const arrow = document.createElement('span');
  arrow.className = 'heading-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.innerHTML = `<svg viewBox="0 0 16 16"><path d="M8 2.2 L12.4 12.2 L8 9.4 L3.6 12.2 Z" fill="${BUS_PIN.arrow}"/></svg>`;
  el.append(arrow);
  return { element: el, arrow };
}

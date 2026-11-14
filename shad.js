/* Shad: a chunky, soft-3D Psyduck-style duck (original drawing, no official art).
   Shading comes from shared SVG gradients, so it reads like a vinyl toy.
   stage 0 = Shad, 1 = Shadow (headache rising), 2 = ShadowBeast (full psychic power).
   Idle animations are discrete frames played back like a flipbook. */
(function () {
  // shared gradients, defined once for every duck on the page
  const DEFS = `
    <radialGradient id="sd-head" cx="40%" cy="28%" r="78%"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".42" stop-color="#FFD75E"/><stop offset="1" stop-color="#E29B2D"/></radialGradient>
    <radialGradient id="sd-body" cx="42%" cy="22%" r="85%"><stop offset="0" stop-color="#FFE580"/><stop offset=".5" stop-color="#FCC94A"/><stop offset="1" stop-color="#D98E25"/></radialGradient>
    <radialGradient id="sd-arm" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="#FFEA94"/><stop offset=".55" stop-color="#FDD053"/><stop offset="1" stop-color="#DD9A30"/></radialGradient>
    <linearGradient id="sd-bill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF9E8"/><stop offset=".55" stop-color="#FFEFCB"/><stop offset="1" stop-color="#F1B88E"/></linearGradient>
    <radialGradient id="sd-hair" cx="35%" cy="22%" r="85%"><stop offset="0" stop-color="#8C5D47"/><stop offset=".5" stop-color="#4C2D21"/><stop offset="1" stop-color="#2A1811"/></radialGradient>
    <radialGradient id="sd-eye" cx="45%" cy="38%" r="65%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".75" stop-color="#FBF5EA"/><stop offset="1" stop-color="#E9DCC4"/></radialGradient>
    <radialGradient id="sd-pupil" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#6E4837"/><stop offset="1" stop-color="#24140D"/></radialGradient>
    <radialGradient id="sd-psy" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color="#FF7AB0"/><stop offset="1" stop-color="#7A2BC8"/></radialGradient>
    <radialGradient id="sd-foot" cx="45%" cy="30%" r="80%"><stop offset="0" stop-color="#FFCB98"/><stop offset="1" stop-color="#E58C52"/></radialGradient>`;
  function installDefs() {
    if (document.getElementById('sd-defs')) return;
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.id = 'sd-defs';
    s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true');
    s.style.position = 'absolute';
    s.innerHTML = `<defs>${DEFS}</defs>`;
    document.body.prepend(s);
  }
  if (document.body) installDefs(); else document.addEventListener('DOMContentLoaded', installDefs);

  function pal(sil) {
    return sil
      ? { head: '#fff', body: '#fff', arm: '#fff', bill: '#fff', hair: '#fff', eye: '#fff', pupil: '#fff', foot: '#fff', crease: 'none', nostril: '#fff', shade: 'none', hi: 'none' }
      : { head: 'url(#sd-head)', body: 'url(#sd-body)', arm: 'url(#sd-arm)', bill: 'url(#sd-bill)', hair: 'url(#sd-hair)', eye: 'url(#sd-eye)', pupil: 'url(#sd-pupil)', foot: 'url(#sd-foot)', crease: '#D08A27', nostril: '#9A6747', shade: 'rgba(170,95,20,.35)', hi: 'rgba(255,255,255,.7)' };
  }

  function arm(press, c) {
    // raised arm: rises from the body, the hand cups the side of the head
    return `<g transform="translate(${press} 0)">
      <path d="M66 152 C34 154 14 130 16 104 C18 82 28 66 44 66 C58 68 60 84 54 98 C49 112 54 134 72 146Z" fill="${c.arm}"/>
      <path d="M32 72 Q38 69 44 72 M28 82 Q35 79 42 82" fill="none" stroke="${c.crease}" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    </g>`;
  }

  function foot(x, c) {
    return `<path d="M${x - 24} 189 Q${x - 26} 179 ${x - 12} 177 L${x + 12} 177 Q${x + 26} 179 ${x + 24} 189 Q${x + 16} 194 ${x + 8} 189 Q${x} 195 ${x - 8} 189 Q${x - 16} 194 ${x - 24} 189Z" fill="${c.foot}"/>`;
  }

  function duck(st, o = {}) {
    const { blink = 0, bob = 0, press = 0, wave = 0, tilt = 0, sil = false, look = [0, 0] } = o;
    const c = pal(sil);
    const s = [0.8, 0.9, 1][st];
    let out = '';

    // ground shadow
    if (!sil) out += `<ellipse cx="100" cy="191" rx="62" ry="6" fill="rgba(0,0,0,.18)"/>`;

    // final form: psychic aura glow behind everything
    if (st === 2 && !sil) {
      [[26, 0.14], [16, 0.25], [7, 0.85]].forEach(([w, op]) => {
        out += `<g fill="none" stroke="#F95587" stroke-width="${w}" opacity="${op}"><circle cx="100" cy="82" r="58"/><ellipse cx="100" cy="142" rx="64" ry="50"/></g>`;
      });
    }

    // psychic ripples over the head, more each stage
    for (let i = 0; i <= st; i++) {
      const r = 70 + i * 11 + wave * 6;
      const a0 = (215 * Math.PI) / 180, a1 = (325 * Math.PI) / 180;
      out += `<path d="M${100 + r * Math.cos(a0)} ${88 + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${100 + r * Math.cos(a1)} ${88 + r * Math.sin(a1)}" fill="none" stroke="${sil ? '#fff' : i % 2 ? '#4F8CF0' : '#F95587'}" stroke-width="${3.4 - i * 0.6}" stroke-linecap="round" opacity="${sil ? 1 : 0.85 - i * 0.18}"/>`;
    }

    // tail, feet, body
    out += `<path d="M58 150 Q32 146 22 122 Q40 128 64 134Z" fill="${c.body}"/>`;
    out += foot(74, c) + foot(126, c);
    out += `<ellipse cx="100" cy="142" rx="56" ry="46" fill="${c.body}"/>`;

    // head group (wobbles with the throb)
    let h = '';
    // three hair tufts, behind the head top
    const tall = st === 2 ? 4 : 0;
    h += `<ellipse cx="81" cy="${36 - tall / 2}" rx="7" ry="${15 + tall}" transform="rotate(-38 81 ${36 - tall / 2})" fill="${c.hair}"/>`;
    h += `<ellipse cx="119" cy="${36 - tall / 2}" rx="7" ry="${15 + tall}" transform="rotate(38 119 ${36 - tall / 2})" fill="${c.hair}"/>`;
    h += `<ellipse cx="100" cy="${24 - tall}" rx="8" ry="${18 + tall}" fill="${c.hair}"/>`;
    h += `<ellipse cx="100" cy="84" rx="56" ry="53" fill="${c.head}"/>`;
    if (!sil) h += `<ellipse cx="80" cy="50" rx="14" ry="7" transform="rotate(-25 80 50)" fill="${c.hi}" opacity=".55"/>`;

    // eyes: big, round, with large dark pupils drifting inward (the classic blank stare)
    const [lx, ly] = look;
    [[76, 72, 1], [124, 73, -1]].forEach(([x0, y0, dir]) => {
      const x = x0, y = y0;
      if (!sil) h += `<circle cx="${x + 1}" cy="${y + 2}" r="25" fill="${c.shade}"/>`;
      if (blink) {
        h += `<circle cx="${x}" cy="${y}" r="23.5" fill="${c.head}"/><path d="M${x - 18} ${y + 2} Q${x} ${y + 10} ${x + 18} ${y + 2}" fill="none" stroke="#7A4A1E" stroke-width="3" stroke-linecap="round"/>`;
        return;
      }
      h += `<circle cx="${x}" cy="${y}" r="23.5" fill="${c.eye}"/>`;
      if (st === 2 && !sil) {
        h += `<circle cx="${x + dir * 3 + lx}" cy="${y - 1 + ly}" r="15" fill="url(#sd-psy)"/><circle cx="${x + dir * 3 + lx}" cy="${y - 1 + ly}" r="19" fill="none" stroke="#F95587" stroke-width="2" opacity=".5"/>`;
      } else {
        // pupils drift toward the cursor (look), on top of the default cross-eyed stare
        const px = x + dir * 4 + lx, py = y - 2 + ly;
        h += `<circle cx="${px}" cy="${py}" r="${st === 1 ? 12 : 14.5}" fill="${c.pupil}"/>`;
        if (!sil) h += `<ellipse cx="${px - 4}" cy="${py - 5}" rx="3" ry="2" fill="#fff" opacity=".55"/>`;
      }
    });
    // sweat drop + worried brows when the headache kicks in
    if (st >= 1 && !sil) h += `<path d="M58 44 Q70 39 84 45 M142 44 Q130 39 116 45" fill="none" stroke="#B5701E" stroke-width="3" stroke-linecap="round"/>`;
    if (st === 1 && !sil) h += `<path d="M156 44 q7 12 0 16 q-7 -4 0 -16Z" fill="#A9DDFF" stroke="#4F8CF0" stroke-width="1.5"/>`;
    out += `<g transform="rotate(${tilt} 100 130)">${h}</g>`;

    // bill: huge, flat, overhanging the belly (shadow first, then bill)
    if (!sil) out += `<ellipse cx="100" cy="150" rx="48" ry="8" fill="${c.shade}"/>`;
    out += `<path d="M54 104 Q100 90 146 104 Q164 116 152 132 Q140 148 100 148 Q60 148 48 132 Q36 116 54 104Z" fill="${c.bill}"/>`;
    if (!sil) {
      out += `<ellipse cx="84" cy="110" rx="22" ry="6" fill="#fff" opacity=".6"/>`;
    }
    out += `<ellipse cx="92" cy="104" rx="3.4" ry="2.3" transform="rotate(-12 92 104)" fill="${c.nostril}"/><ellipse cx="108" cy="104" rx="3.4" ry="2.3" transform="rotate(12 108 104)" fill="${c.nostril}"/>`;

    // arms on top: both hands cupping the head
    out += arm(press, c);
    out += `<g transform="translate(200 0) scale(-1 1)">${arm(press, c)}</g>`;

    // manga pain marks while the throb peaks
    if (!sil && press >= 3) out += `<path d="M18 62 l-9 -7 M14 76 l-11 -1 M182 62 l9 -7 M186 76 l11 -1" stroke="#000" stroke-width="3" stroke-linecap="round"/>`;

    return `<g transform="translate(0 ${bob}) translate(100 194) scale(${s}) translate(-100 -194)">${out}</g>`;
  }

  // 8-frame idle: a headache throb (hands squeeze, head wobbles, ripples pulse, one blink)
  const BOB = [0, -1, -2, -3, -2, -1, 0, 1];
  const PRESS = [0, 1, 2, 3, 2, 1, 0, 0];
  const TILT = [0, -1.5, -3, -1.5, 0, 1.5, 3, 1.5];
  function frame(st, i, extra = {}) {
    i = i % 8;
    return duck(st, Object.assign({ bob: BOB[i], press: PRESS[i], tilt: TILT[i], blink: i === 5, wave: i / 8 }, extra));
  }
  function idle(st) { return BOB.map((_, i) => frame(st, i)); }

  window.Shad = { draw: duck, idle, frame };
})();

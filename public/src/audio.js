/* Procedural Web Audio: no asset files. */
(function (root) {
  let ctx = null, on = true, beatT = 0, drone = null, wailT = 0;
  function tone(f, d, type = 'sine', v = 0.12, slide = 0) {
    if (!ctx || !on) return; const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d);
  }
  const A = {
    init() { if (!ctx) { try { ctx = new (root.AudioContext || root.webkitAudioContext)(); } catch (e) {} } if (ctx && ctx.state === 'suspended') ctx.resume();
      if (ctx && !drone) { drone = ctx.createGain(); drone.gain.value = on ? .05 : 0; drone.connect(ctx.destination);
        [48, 50.5, 96].forEach(f => { const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 180; o.connect(lp).connect(drone); o.start(); }); } },
    toggle() { on = !on; if (drone) drone.gain.value = on ? .05 : 0; return on; },
    pickup() { tone(660, .12, 'triangle', .1); setTimeout(() => tone(990, .18, 'triangle', .1), 70); },
    emp() { tone(220, .8, 'sawtooth', .18, -180); tone(60, .9, 'square', .12, -30); },
    decoy() { tone(440, .25, 'sine', .1, 300); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, .3, 'triangle', .13), i * 110)); },
    lose() { tone(500, 1.1, 'sawtooth', .18, -420); setTimeout(() => tone(250, 1, 'square', .12, -200), 300); },
    /* prox 0..1; called every frame */
    tick(prox, dt) { wailT -= dt; if (prox > .35 && wailT <= 0) { wailT = 2.5 + Math.random() * 2; tone(420 + Math.random() * 80, 1.4, 'sine', .04 + prox * .08, -150); tone(430, 1.4, 'triangle', .03, -140); } beatT -= dt; if (beatT <= 0) { beatT = 1.1 - 0.85 * prox; tone(50 + 40 * prox, .12, 'sine', .08 + .12 * prox); setTimeout(() => tone(45 + 30 * prox, .1, 'sine', .06 + .1 * prox), 120); } }
  };
  root.CyberAudio = A;
})(window);

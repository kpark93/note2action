// A short, satisfying "pop" synthesized with the Web Audio API — no audio
// asset to ship, works offline, and easy to tune. Called on task completion.
// Path: tasks.view.tsx (Done checkbox) → [this file] (leaf — Web Audio API,
// no network).

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  return ctx;
}

/** Play a crisp pop. Safe to call from a click/change handler (a user gesture). */
export function playPop(): void {
  const ac = getCtx();
  if (!ac) return;
  // Browsers start the context suspended until a gesture resumes it.
  if (ac.state === "suspended") void ac.resume();

  const now = ac.currentTime;
  const out = ac.createGain();
  out.gain.value = 0.4;
  out.connect(ac.destination);

  // Body: a sine that snaps up then drops — the round "pop".
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.03);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(1, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  osc.connect(g).connect(out);
  osc.start(now);
  osc.stop(now + 0.22);

  // Transient: a tiny high "tick" for a hi-fi, crisp attack.
  const click = ac.createOscillator();
  const cg = ac.createGain();
  click.type = "triangle";
  click.frequency.setValueAtTime(1800, now);
  cg.gain.setValueAtTime(0.0001, now);
  cg.gain.exponentialRampToValueAtTime(0.4, now + 0.004);
  cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  click.connect(cg).connect(out);
  click.start(now);
  click.stop(now + 0.06);
}

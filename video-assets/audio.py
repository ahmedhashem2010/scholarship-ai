"""
Sound design — premium SaaS launch bed.

Everything is synthesised from arithmetic. No samples, no licensing exposure,
nothing to clear — which matters when the same file goes to a landing page,
paid social, and an investor deck.

Mix philosophy, in priority order:
  1. **Ambient pad** sits under the whole film at about -32dB. It is the thing
     that makes silence feel intentional rather than broken.
  2. **UI sounds** land exactly on the frame the pixel moves. Late is worse
     than absent.
  3. **Whooshes** mark scene seams only. One per cut, never decorative.
  4. **Nothing rings longer than its animation.** Long tails muddy the next beat.

There is deliberately no music bed with melody or drums: the brief calls for a
premium startup feel, and voiceover has to sit on top of this without fighting.
"""

import math
import wave

import numpy as np

SR = 44100
_rng = np.random.default_rng(11)


def _t(dur):
    return np.linspace(0, dur, int(SR * dur), endpoint=False)


def _env(n, a=0.002, d=0.06, s=0.0, r=0.03):
    na, nd, nr = int(SR * a), int(SR * d), int(SR * r)
    ns = max(0, n - na - nd - nr)
    e = np.concatenate([
        np.linspace(0, 1, na, endpoint=False) if na else np.array([]),
        np.linspace(1, s, nd, endpoint=False) if nd else np.array([]),
        np.full(ns, s),
        np.linspace(s, 0, nr) if nr else np.array([]),
    ])
    return np.pad(e, (0, max(0, n - len(e))))[:n]


def _lowpass(x, cut):
    y, out = 0.0, np.zeros_like(x)
    for i in range(len(x)):
        y += cut * (x[i] - y)
        out[i] = y
    return out


# --- Atoms -----------------------------------------------------------------

def key_press():
    """Mechanical keyboard. Short noise thock plus a low body."""
    t = _t(0.05)
    n = np.diff(_rng.normal(0, 1, len(t)), prepend=0)
    body = np.sin(2 * np.pi * 220 * t)
    return (n * 0.5 + body * 0.3) * _env(len(t), 0.0004, 0.016, 0, 0.02) * 0.30


def click():
    t = _t(0.05)
    n = np.diff(_rng.normal(0, 1, len(t)), prepend=0)
    return (n * 0.45 + np.sin(2 * np.pi * 2600 * t) * 0.4) * \
        _env(len(t), 0.0004, 0.016, 0, 0.026) * 0.55


def beep(f=1900, dur=0.045):
    t = _t(dur)
    return np.sin(2 * np.pi * f * t) * _env(len(t), 0.0008, 0.014, 0, 0.018) * 0.13


def pop(f=880, dur=0.09):
    t = _t(dur)
    ff = f * (1 + 0.42 * np.exp(-t * 65))
    return np.sin(2 * np.pi * ff * t) * _env(len(t), 0.001, 0.03, 0, 0.05) * 0.20


def whoosh(dur=0.42, rise=True):
    t = _t(dur)
    n = _rng.normal(0, 1, len(t))
    out = np.zeros_like(n)
    y = 0.0
    for i in range(len(n)):
        p = i / len(n)
        cut = 0.03 + 0.60 * (p if rise else 1 - p)
        y += cut * (n[i] - y)
        out[i] = y
    return out * (np.sin(np.pi * np.linspace(0, 1, len(t))) ** 1.25) * 0.30


def impact(dur=0.55):
    """Sub-heavy hit for the collapse into the logo reveal."""
    t = _t(dur)
    f = 140 * np.exp(-t * 9) + 38
    body = np.sin(2 * np.pi * f * t) * _env(len(t), 0.001, 0.2, 0, 0.3)
    air = _lowpass(_rng.normal(0, 1, len(t)), 0.25) * _env(len(t), 0.001, 0.1, 0, 0.2)
    return (body * 0.62 + air * 0.18)


def ai_process(dur=1.6):
    """'Thinking' texture: three detuned sines sweeping upward with a shimmer.
    Reads as computation without resorting to sci-fi cliché."""
    t = _t(dur)
    out = np.zeros_like(t)
    for k, base in enumerate([420, 630, 840]):
        f = base * (1 + 0.55 * (t / dur) ** 1.5)
        out += np.sin(2 * np.pi * f * t) * 0.05 * (1 - k * 0.22)
    shimmer = _lowpass(_rng.normal(0, 1, len(t)), 0.5) * 0.03
    env = np.sin(np.pi * np.linspace(0, 1, len(t))) ** 0.8
    return (out + shimmer) * env


def data_ticks(n=14, spread=1.4, f0=1500):
    """Rapid ticks for scanning / counting."""
    out = np.zeros(int(SR * (spread + 0.1)))
    for i in range(n):
        at = int(SR * (i / n) * spread)
        s = beep(f0 + i * 45, 0.03) * 0.55
        out[at:at + len(s)] += s
    return out


def chime(dur=1.4, root=523.25):
    t = _t(dur)
    out = np.zeros_like(t)
    for f, amp in [(root, 0.10), (root * 1.5, 0.07), (root * 2, 0.05)]:
        out += np.sin(2 * np.pi * f * t) * amp
    return out * _env(len(t), 0.01, 0.4, 0.2, 0.6)


def success_arp(dur=0.85):
    t = _t(dur)
    out = np.zeros_like(t)
    for i, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
        at = int(SR * (i * dur / 4.6))
        seg = _t(0.28)
        s = np.sin(2 * np.pi * f * seg) * _env(len(seg), 0.004, 0.09, 0.07, 0.13) * 0.11
        out[at:at + len(s)] += s[:len(out) - at]
    return out


def notify():
    """Two-note notification, the universal 'something arrived'."""
    out = np.zeros(int(SR * 0.5))
    for i, f in enumerate([880, 1174.66]):
        at = int(SR * i * 0.11)
        seg = _t(0.26)
        s = np.sin(2 * np.pi * f * seg) * _env(len(seg), 0.003, 0.08, 0.05, 0.14) * 0.13
        out[at:at + len(s)] += s[:len(out) - at]
    return out


def pad(dur):
    """Ambient synth bed — a slow-moving minor-ninth stack."""
    t = _t(dur)
    out = np.zeros_like(t)
    for f, amp, det in [(82.41, 0.055, 0.0), (82.41, 0.045, 0.55),
                        (123.47, 0.038, 0.0), (164.81, 0.028, 0.35),
                        (246.94, 0.016, 0.0)]:
        out += np.sin(2 * np.pi * (f + det) * t) * amp
    out *= 0.68 + 0.32 * np.sin(2 * np.pi * 0.055 * t)
    air = _lowpass(_rng.normal(0, 1, len(t)), 0.0018) * 0.55
    return (out + air) * 0.46


# --- Timeline --------------------------------------------------------------

def build(path, scenes, total):
    track = np.zeros(int(SR * (total + 1.2)))

    def at(sig, when, gain=1.0):
        i = int(SR * when)
        if i < 0:
            return
        end = min(len(track), i + len(sig))
        if end > i:
            track[i:end] += sig[:end - i] * gain

    s, acc = {}, 0.0
    for name, _fn, dur in scenes:
        s[name] = acc
        acc += dur

    n = int(SR * total)
    track[:n] += pad(total)[:n]

    # --- 1 chaos: typing, then chips piling in, then collapse -------------
    c = s["chaos"]
    for i in range(22):                       # keystrokes
        at(key_press(), c + 0.12 + i * 0.062, 0.85)
    at(beep(1200, 0.05), c + 1.55, 0.7)       # results land
    for i in range(10):                       # requirement chips, accelerating
        at(pop(300 + i * 22, 0.07), c + 2.6 + i * 0.17, 0.55 + i * 0.035)
    at(whoosh(0.6, False), c + 5.25, 1.0)     # collapse
    at(impact(), c + 5.55, 1.0)

    # --- 2 reveal ----------------------------------------------------------
    r = s["reveal"]
    at(pop(660, 0.16), r + 0.35, 0.9)
    at(chime(1.6, 392), r + 0.42, 0.85)
    at(whoosh(0.34), r + 0.75, 0.5)           # wordmark wipe
    at(whoosh(0.4), r + 4.0, 0.85)

    # --- 3 match -----------------------------------------------------------
    m = s["match"]
    for k in (0.7, 1.5, 2.3):                 # three answers
        at(click(), m + k, 0.9)
        at(pop(1050, 0.07), m + k + 0.02, 0.7)
    at(ai_process(1.7), m + 2.9, 0.95)        # thinking
    at(data_ticks(16, 1.4, 1400), m + 3.1, 0.5)
    for i in range(3):                        # cards land
        at(pop(720 + i * 140), m + 4.62 + i * 0.16, 0.9)
        at(beep(1700 + i * 130, 0.035), m + 4.78 + i * 0.16, 0.6)
    at(whoosh(0.3), m + 6.7, 0.7)             # re-sort
    at(whoosh(0.4), m + 10.5, 0.85)

    # --- 4 eligibility -----------------------------------------------------
    e = s["eligible"]
    at(whoosh(0.34), e + 0.05, 0.7)
    at(data_ticks(10, 0.95, 1250), e + 0.85, 0.55)   # scanning
    for i in range(5):                                # ticks
        at(beep(1500 + i * 130, 0.05), e + 1.82 + i * 0.42, 0.85)
        at(pop(900 + i * 90, 0.07), e + 1.86 + i * 0.42, 0.6)
    at(success_arp(), e + 4.42, 1.0)                  # HIGHLY RECOMMENDED
    at(whoosh(0.4), e + 8.5, 0.85)

    # --- 5 review ----------------------------------------------------------
    v = s["review"]
    at(pop(520, 0.12), v + 0.05, 0.8)
    at(ai_process(1.8), v + 0.85, 0.8)
    at(data_ticks(20, 1.7, 1600), v + 0.9, 0.6)
    for i in range(4):                                # sections resolve
        at(pop(640 + i * 110, 0.08), v + 2.7 + i * 0.38, 0.75)
    at(data_ticks(12, 1.2, 900), v + 3.1, 0.4)        # score counting
    at(chime(1.0, 659.25), v + 4.3, 0.6)              # 91 lands
    at(whoosh(0.4), v + 9.5, 0.85)

    # --- 6 journey ---------------------------------------------------------
    j = s["journey"]
    for i in range(7):                                # milestones
        at(beep(1000 + i * 120, 0.05), j + 1.0 + i * 0.72, 0.8)
        at(pop(560 + i * 70, 0.08), j + 1.02 + i * 0.72, 0.55)
    at(notify(), j + 3.25, 0.9)                       # reminder toast
    at(success_arp(), j + 5.85, 1.0)                  # accepted
    at(chime(1.8, 523.25), j + 5.95, 0.9)
    at(whoosh(0.4), j + 9.5, 0.85)

    # --- 7 end -------------------------------------------------------------
    x = s["end"]
    at(pop(700, 0.14), x + 0.05, 0.9)
    at(chime(2.0, 392), x + 0.15, 0.8)
    at(pop(900, 0.1), x + 0.95, 0.6)
    at(pop(1100, 0.1), x + 1.2, 0.6)
    at(pop(1300, 0.12), x + 2.25, 0.75)               # CTA

    # Master. tanh gives gentle saturation instead of hard clipping, which
    # matters because these files get re-encoded by every social platform.
    track = np.tanh(track * 1.12)
    peak = np.max(np.abs(track)) or 1.0
    track = track / peak * 0.86
    f = int(SR * 0.035)
    track[:f] *= np.linspace(0, 1, f)
    track[-f:] *= np.linspace(1, 0, f)

    pcm = (track * 32767).astype(np.int16)
    stereo = np.repeat(pcm[:, None], 2, axis=1).flatten()
    with wave.open(path, "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())
    print(f"  audio: {len(track)/SR:.1f}s")

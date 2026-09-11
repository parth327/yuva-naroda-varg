import { useEffect, useRef, useState } from 'react';

// Ambient background music toggle, ported from register.ejs/particles.js.
// Starts muted (browsers always allow muted autoplay) and unmutes on the
// visitor's first real interaction with the page.
export default function AmbientAudioToggle() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const userDisabledRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;
    audio.muted = true;
    audio.play().catch(() => {});

    function unmuteOnFirstInteraction() {
      events.forEach((ev) => window.removeEventListener(ev, unmuteOnFirstInteraction));
      if (userDisabledRef.current) return;
      audio.muted = false;
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    events.forEach((ev) => window.addEventListener(ev, unmuteOnFirstInteraction, { once: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, unmuteOnFirstInteraction));
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      userDisabledRef.current = true;
      audio.pause();
      setPlaying(false);
    } else {
      userDisabledRef.current = false;
      audio.muted = false;
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <>
      <audio ref={audioRef} loop preload="auto">
        <source src="/audio/bg-music.mp3" type="audio/mpeg" />
      </audio>
      <button
        type="button"
        onClick={toggle}
        aria-label="Toggle music"
        className="ys-audio-toggle"
      >
        {playing ? '🔊' : '🔈'}
      </button>
    </>
  );
}

/**
 * Pure Web Audio API Ambient Sound Synthesizer
 * Generates calm, meditative luxury salon ambient chimes
 * without external audio file dependencies.
 */

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: any = null;
  private gainNode: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public start() {
    try {
      this.initContext();
      if (!this.ctx) return;
      this.isPlaying = true;

      // Master gain
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);

      // Play soft luxury chime pattern
      const chords = [
        [261.63, 329.63, 392.00, 523.25], // C major 7
        [220.00, 261.63, 329.63, 440.00], // A minor 7
        [174.61, 220.00, 261.63, 349.23], // F major
        [196.00, 246.94, 293.66, 392.00], // G major
      ];

      let chordIdx = 0;

      const playChord = () => {
        if (!this.isPlaying || !this.ctx || !this.gainNode) return;
        const notes = chords[chordIdx % chords.length];
        chordIdx++;

        notes.forEach((freq, i) => {
          if (!this.ctx || !this.gainNode) return;
          const osc = this.ctx.createOscillator();
          const noteGain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          // Soft attack and slow warm decay
          const startTime = this.ctx.currentTime + i * 0.4;
          noteGain.gain.setValueAtTime(0.0001, startTime);
          noteGain.gain.exponentialRampToValueAtTime(0.02, startTime + 1.2);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 5.5);

          osc.connect(noteGain);
          noteGain.connect(this.gainNode);

          osc.start(startTime);
          osc.stop(startTime + 6.0);
        });
      };

      playChord();
      this.intervalId = setInterval(playChord, 6000);
    } catch (e) {
      console.warn('Ambient audio could not be initialized:', e);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

export const ambientAudio = new AmbientAudioEngine();


export enum Sound {
    Mario = 'mario',
    Alert = 'alert',
}

interface IBeep {
    type?: OscillatorType;
    blocking?: boolean;
    volume?: number;
    delay?: number;
}

const midiTable = Object.freeze([
    [" ", "C-0", "C#-1", "D-2", "Eb-3", "E-4", "F-5", "F#-6", "G-7", "G#-8", "A-9", "Bb-9", "B-10"],
    ["0", 16.35, 17.32,  18.35, 19.45,  20.6,  21.83, 23.12,  24.5,  25.96,  27.5,  29.14,  30.87],
    ["1", 32.7,  34.65,  36.71, 38.89,  41.2,  43.65, 46.25,  49,    51.91,  55,    58.27,  61.74],
    ["2", 65.41, 69.3,   73.42, 77.78,  82.41, 87.31, 92.5,   98,    103.8,  110,   116.5,  123.5],
    ["3", 130.8, 138.6,  146.8, 155.6,  164.8, 174.6, 185,    196,   207.7,  220,   233.1,  246.9],
    ["4", 261.6, 277.2,  293.7, 311.1,  329.6, 349.2, 370,    392,   415.3,  440,   466.2,  493.9],
    ["5", 523.3, 554.4,  587.3, 622.3,  659.3, 698.5, 740,    784,   830.6,  880,   932.3,  987.8],
    ["6", 1047,  1109,   1175,  1245,   1319,  1397,  1480,   1568,  1661,   1760,  1865,   1976],
    ["7", 2093,  2217,   2349,  2489,   2637,  2794,  2960,   3136,  3322,   3520,  3729,   3951],
    ["8", 4186,  4435,   4699,  4978,   5274,  5588,  5920,   6272,  6645,   7040,  7459,   7902],
].slice(1).map((l) => Object.freeze(l.slice(1)))) as number[][];

type note = [number, number] | number;

type sound = [note, number, IBeep?];

const soundMap = new Map<string, sound[]>(Object.entries({
    [Sound.Mario]: [
        [[4, 4], 200, {blocking: true}],
        [[4, 4], 200, {blocking: true}],
        [0, 200, {blocking: true}],
        [[4, 4], 200, {blocking: true}],
        [0, 200, {blocking: true}],
        [[4, 0], 200, {blocking: true}],
        [[4, 4], 200, {blocking: true}],
        [0, 200, {blocking: true}],
        [[4, 7], 200, {blocking: true}],
    ],
    [Sound.Alert]: [
        [[4, 1], 100, {type: 'sawtooth'}],
        [[4, 5], 100, {delay: 50, type: 'sawtooth'}],
        [[4, 7], 100, {delay: 100, type: 'sawtooth'}],
        [[4, 10], 100, {delay: 150, type: 'sawtooth'}],
        [[5, 1], 100, {delay: 200, type: 'sawtooth'}],
        [[5, 4], 100, {delay: 250, type: 'sawtooth'}],
        [[5, 7], 100, {delay: 300, type: 'sawtooth'}],
        [[5, 10], 200, {delay: 350, type: 'sawtooth'}],
    ],
}));

// eslint:disable-next-line: new-parens
const soundManager = new class {

    private context: AudioContext = null as never;

    constructor() {
        const { body } = document;
        const handleContext = () => {
            this.context = new AudioContext();
            body.removeEventListener('click', handleContext); 
        };
        body.addEventListener('click', handleContext); 
    }

    public get hasContext(): boolean {
        return !!this.context;
    }

    private sleep = (duration = 200) => new Promise((resolve) => {
        setTimeout(resolve, duration);
    });    

    public beep = async (
        freq: note = 520,
        duration = 200, {
            type = 'square',
            blocking = false,
            volume = 100, 
            delay = 0,
        }: IBeep = {},
    ) => {
        let frequency = freq;
        if (Array.isArray(frequency)) {
            const [row, col] = frequency;
            frequency = midiTable[row][col];
        }
        if (this.context) {
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            oscillator.connect(gain);
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            gain.connect(this.context.destination);
            gain.gain.value = volume * 0.01;
            oscillator.start(this.context.currentTime + (delay * 0.001));
            oscillator.stop(this.context.currentTime + (duration * 0.001) + (delay * 0.001));
            if (blocking) {  
                await this.sleep(duration);
            }
        }
    };

}();

export const playSound = async (sound: Sound) => {
    if (soundManager.hasContext) {
        const notes = soundMap.get(sound.toString())!;
        for (let n of notes) {
            await soundManager.beep(...n);
        }
    } else {
        console.warn('soundManager failed to handle AudioContext');
    }
};

export default playSound;

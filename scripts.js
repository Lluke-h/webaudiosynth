const audioCtx = new (window.AudioContext || window.webkitAudioContext);

const osc = audioCtx.createOscillator();

const volumeControlGain = audioCtx.createGain();
volumeControlGain.connect(audioCtx.destination);

const semitoneMap = {
    C: -9,
    Cs: -8,
    D: -7,
    Ds: -6,
    E: -5,
    F: -4,
    Fs: -3,
    G: -2,
    Gs: -1,
    A: 0,
    As: 1,
    B: 2,
};

const keyCodeNotes = {
    x: ['C','4'],
    c: ['D','4'],
    v: ['E','4'],
    b: ['F','4'],
    n: ['G','4'],
    ',': ['A','4'],
    ';': ['B','4'],
    ':': ['C','5'],
    d: ['Cs','4'],
    f: ['Ds','4'],
    h: ['Fs','4'],
    j: ['Gs','4'],
    k: ['As','4'],



};


timbre = {
    harmonicsMultiplicators: [1, 2, 4,9,0.5, 1.5],
    harmonicAmplitudes: [1, 0.9, 0.2,0.6,0.8,0.7]
};


function getFrequency(noteName) {
    const note = noteName[0];
    const octave = noteName[1];
    const semitone = semitoneMap[note] + (octave - 4) * 12;
    return 440 * Math.pow(Math.pow(2, 1 / 12), semitone);
}

// Generate an array of tone objects for each keyboard key


function createTones(keyCodeNotes, timbre) {

    let tones = {};

    for (let [key, noteName] of Object.entries(keyCodeNotes)) {

        const fundFreq = getFrequency(noteName);  // fundamental frequency in Hertz
        const noteGain = audioCtx.createGain();
        // noteGain.connect(volumeControlGain);

        let oscs = [];
        let harmonicGains = [];

        for (let i = 0; i < timbre.harmonicsMultiplicators.length; i++) {
            let osc = audioCtx.createOscillator();
            let harmonicGain = audioCtx.createGain();
            osc.frequency.value = fundFreq * timbre.harmonicsMultiplicators[i];
            osc.start();
            harmonicGain.gain.value = timbre.harmonicAmplitudes[i];

            osc.connect(harmonicGain);
            harmonicGain.connect(noteGain);

            oscs.push(osc);
            harmonicGains.push(harmonicGain);

        }

        tones[key] = {
            note: noteName,
            oscs: oscs,
            harmonicGains: harmonicGains,
            noteGain: noteGain
        };
    }

    return tones
}

let tones = createTones(keyCodeNotes, timbre);

document.addEventListener('keydown', function (e) {
    console.log(e.key)
    tones[e.key].noteGain.connect(volumeControlGain)
    document.querySelector(`#${e.key}`).classList.add('active')

});
document.addEventListener('keyup', function (e) {
    tones[e.key].noteGain.disconnect(volumeControlGain)
    document.querySelector(`#${e.key}`).classList.remove('active')
});

document.addEventListener('change',function (e) {
    timbre.harmonicsMultiplicators = document.querySelector('#harmonics').value.split(',').map(Number);
    timbre.harmonicAmplitudes = document.querySelector('#amplitudes').value.split(',').map(Number);
    tones = createTones(keyCodeNotes, timbre)
});
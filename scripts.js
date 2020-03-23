const audioCtx = new (window.AudioContext || window.webkitAudioContext);

const osc = audioCtx.createOscillator();

const volumeControlGain = audioCtx.createGain();
volumeControlGain.connect(audioCtx.destination);


const keyCodeNotes = {
    s: ['C', '4'],
    d: ['D', '4'],
    f: ['E', '4'],
    g: ['F', '4'],
    h: ['G', '4'],
    j: ['A', '4'],
    k: ['B', '4'],
    l: ['C', '5'],
    e: ['Cs', '4'],
    r: ['Ds', '4'],
    y: ['Fs', '4'],
    u: ['Gs', '4'],
    i: ['As', '4'],
};


timbre = {
    harmonicsMultiplicators: [1, 4.0324,   10.0274,   17.3458],
    harmonicAmplitudes: [0.9731,    0.8694,    1.0000,    0.9088]
};


function getFrequency(noteName) {
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
    const note = noteName[0];
    const octave = noteName[1];
    const semitone = semitoneMap[note] + (octave - 4) * 12;
    return 440 * Math.pow(Math.pow(2, 1 / 12), semitone);
}

// Generates an array of tone objects for each keyboard key
function createTones(keyCodeNotes, timbre) {
    console.log('create Tones !');
    let tones = {};

    for (let [key, noteName] of Object.entries(keyCodeNotes)) {

        const fundFreq = getFrequency(noteName);  // fundamental frequency in Hertz
        const noteGain = audioCtx.createGain();
        noteGain.gain.value = 0;
        noteGain.connect(volumeControlGain);

        let oscs = [];
        let harmonicGains = [];

        for (let i = 0; i < timbre.harmonicsMultiplicators.length; i++) {
            let osc = audioCtx.createOscillator();
            let harmonicGain = audioCtx.createGain();
            osc.frequency.value = fundFreq * timbre.harmonicsMultiplicators[i];
            osc.start(0);
            harmonicGain.gain.value = timbre.harmonicAmplitudes[i];

            osc.connect(harmonicGain);
            harmonicGain.connect(noteGain);

            oscs.push(osc);
            harmonicGains.push(harmonicGain);

        }

        tones[key] = {
            playing: false,
            note: noteName,
            oscs: oscs,
            harmonicGains: harmonicGains,
            noteGain: noteGain
        };
    }

    return tones
}

function destroyTones(tones) {
    console.log('destroyed all Oscillators');
    Object.values(tones).forEach(tone => tone.oscs.forEach(osc => {
        osc.stop();
    }));
}

function playNote(e){
    let now = audioCtx.currentTime;
    if (tones[e.key].playing === false){
        tones[e.key].playing = true;
        tones[e.key].noteGain.gain.cancelScheduledValues( now );
        console.log('Connected');
        tones[e.key].noteGain.gain.setValueAtTime(1, now);
        tones[e.key].noteGain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
        document.querySelector(`#${e.key}`).classList.add('active')
    }

}
// create tones with the initial timbre
let tones = createTones(keyCodeNotes, timbre);

// On keydown play the correct tone and make button active
document.addEventListener('keydown', function (e) {
    // tones[e.key].noteGain.connect(volumeControlGain);
    playNote(e);
});

// On keyUp stop playing the sound
document.addEventListener('keyup', function (e) {
    tones[e.key].noteGain.gain.cancelScheduledValues( audioCtx.currentTime);
    tones[e.key].noteGain.gain.setValueAtTime(0, audioCtx.currentTime);
    tones[e.key].playing = false;
    document.querySelector(`#${e.key}`).classList.remove('active')
});


function randomIntFromInterval(min, max) { // min and max included
    return Math.round(Math.random() * (max - min + 1) + min);
}


function updateTimbre() {
    const textInputs = Array.from(document.querySelectorAll('input[type=text]'));
    timbre.harmonicsMultiplicators = textInputs.map(text => isNaN(parseFloat(text.value)) ? 0 : parseFloat(text.value));
    console.log(timbre.harmonicsMultiplicators);

    const ranges = Array.from(document.querySelectorAll('input[type=range]'));
    timbre.harmonicAmplitudes = ranges.map(range => {
        let value = range.valueAsNumber / range.max;
        range.nextElementSibling.textContent = value;
        console.log(range.nextElementSibling);
        return value
    });
    console.log(timbre.harmonicAmplitudes);

    destroyTones(tones);
    tones = createTones(keyCodeNotes, timbre);

}

function randomizeTimbre() {
    const textInputs = Array.from(document.querySelectorAll('input[type = text]'));
    textInputs.forEach(textInput => textInput.value = randomIntFromInterval(1, 20) * 0.5 - 1);

    const ranges = Array.from(document.querySelectorAll('input[type=range]'));
    ranges.forEach(range => {
        range.value = randomIntFromInterval(1, 100)
    });

    updateTimbre()
}

document.addEventListener('change', updateTimbre);

// // Update timbre
// document.addEventListener('change',function (e) {
//     timbre.harmonicsMultiplicators = document.querySelector('#harmonics').value.split(',').map(Number);
//     timbre.harmonicAmplitudes = document.querySelector('#amplitudes').value.split(',').map(Number);
//     tones = createTones(keyCodeNotes, timbre)
// });
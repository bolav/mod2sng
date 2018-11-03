const fs = require('fs');
const Protracker = require('protracker');
const SNG = require('./SNG');
const mod = new Protracker();

// load module from url into local buffer
Protracker.prototype.load_file = function (file) {
    console.log('loading', file);
    this.playing = false; // a precaution

    this.url = file;
    this.clearsong();

    this.loading = true;
    const asset = this;
    fs.readFile(file, (err, data) => {
        if (err) throw err;
        asset.buffer = data;
        asset.parse();
    });
};


mod.load_file('dzdebut.mod');

mod.onReady = function () {
    saveSNG(mod);
}

const notes = {
    856: 'c3', 808: 'c#3', 762: 'd3', 720: 'd#3', 678: 'e3', 640: 'f3', 604: 'f#3', 570: 'g3', 538: 'g#3', 508: 'a3', 480: 'a#3', 453: 'b3',
    428: 'c4', 404: 'c#4', 381: 'd4', 360: 'd#4', 339: 'e4', 320: 'f4', 302: 'f#4', 285: 'g4', 269: 'g#4', 254: 'a4', 240: 'a#4', 226: 'b4',
    214: 'c5', 202: 'c#5', 190: 'd5', 180: 'd#5', 170: 'e5', 160: 'f5', 151: 'f#5', 143: 'g5', 135: 'g#5', 127: 'a5', 120: 'a#5', 113: 'b5'
}

const sngNote = {
    'c0': 0x60,
    'c#0': 0x61,
    'd0': 0x62,
    'd#0': 0x63,
    'e0': 0x64,
    'f0': 0x65,
    'f#0': 0x66,
    'g0': 0x67,
    'g#0': 0x68,
    'a0': 0x69,
    'a#0': 0x6a,
    'b0': 0x6b,

    'c1': 0x6c,
    'c#1': 0x6d,
    'd1': 0x6e,
    'd#1': 0x6f,
    'e1': 0x70,
    'f1': 0x71,
    'f#1': 0x72,
    'g1': 0x73,
    'g#1': 0x74,
    'a1': 0x75,
    'a#1': 0x76,
    'b1': 0x77,

    'c2': 0x78,
    'c#2': 0x79,
    'd2': 0x7a,
    'd#2': 0x7b,
    'e2': 0x7c,
    'f2': 0x7d,
    'f#2': 0x7e,
    'g2': 0x7f,
    'g#2': 0x80,
    'a2': 0x81,
    'a#2': 0x82,
    'b2': 0x83,

    'c3': 0x84,
    'c#3': 0x85,
    'd3': 0x86,
    'd#3': 0x87,
    'e3': 0x88,
    'f3': 0x89,
    'f#3': 0x8a,
    'g3': 0x8b,
    'g#3': 0x8c,
    'a3': 0x8d,
    'a#3': 0x8e,
    'b3': 0x8f,

    'c4': 0x90,
    'c#4': 0x91,
    'd4': 0x92,
    'd#4': 0x93,
    'e4': 0x94,
    'f4': 0x95,
    'f#4': 0x96,
    'g4': 0x97,
    'g#4': 0x98,
    'a4': 0x99,
    'a#4': 0x9a,
    'b4': 0x9b,

    'c5': 0x9c,
    'c#5': 0x9d,
    'd5': 0x9e,
    'd#5': 0x9f,
    'e5': 0xa0,
    'f5': 0xa1,
    'f#5': 0xa2,
    'g5': 0xa3,
    'g#5': 0xa4,
    'a5': 0xa5,
    'a#5': 0xa6,
    'b5': 0xa7,

    'c6': 0xa8,
    'c#6': 0xa9,
    'd6': 0xaa,
    'd#6': 0xab,
    'e6': 0xac,
    'f6': 0xad,
    'f#6': 0xae,
    'g6': 0xaf,
    'g#6': 0xb0,
    'a6': 0xb1,
    'a#6': 0xb2,
    'b6': 0xb3,

    'c7': 0xb4,
    'c#7': 0xb5,
    'd7': 0xb6,
    'd#7': 0xb7,
    'e7': 0xb8,
    'f7': 0xb9,
    'f#7': 0xba,
    'g7': 0xbb,
    'g#7': 0xbc,
};

function parseModNote(byte1, byte2, byte3, byte4) {
    const sampleNumber = (byte1 & 0xf0) + ((byte3 & 0xf0) >> 4);
    const notePeriod = ((byte1 & 0x0f) << 8) + byte2;
    const effectCmd = ((byte3 & 0x0f) << 8) + byte4;
    return {
        sampleNumber,
        notePeriod,
        note: notes[notePeriod],
        effectCmd
    };
}

function convertToPattern(notes) {
    const buf = Buffer.allocUnsafe(notes.length * 4);
    for (let i in notes) {
        if (!sngNote[notes[i]['note']] && notes[i]['note']) {
            console.log('missing ', notes[i]['note']);
        }
        buf[i * 4] = sngNote[notes[i]['note']] || 0xBD;
        buf[(i * 4) + 1] = notes[i]['sampleNumber'];
        buf[(i * 4) + 2] = 0;
        buf[(i * 4) + 3] = 0;

    }
    return buf;
}

function saveSNG(mod) {
    sng = new SNG();
    console.log('converting sng');
    console.log(mod.title);
    sng.songName = mod.title;
    for (let i in mod.sample) {
        sng.instruments.push({
            AD: 1,
            SR: 88,
            Wavepointer: 1,
            Pulsepointer: 0,
            Filterpointer: 0,
            VibratoParam: 0,
            VibraroDelay: 0,
            Gateoff: 4,
            HardRestart: 9,
            InstrumentName: mod.sample[i].name,
        });
    }

    // Copy Patterns
    sng.patterns = [];
    const patternIdx = [];
    for (let i in mod.pattern) {
        for (let chan = 0; chan < 4; chan++) {
            const notes = [];
            for (let row = 0; row < 64; row++) {
                const note = parseModNote(
                    mod.pattern[i][(row * 16) + (chan * 4) + 0],
                    mod.pattern[i][(row * 16) + (chan * 4) + 1],
                    mod.pattern[i][(row * 16) + (chan * 4) + 2],
                    mod.pattern[i][(row * 16) + (chan * 4) + 3]);
                notes.push(note);
            }
            const pattern = convertToPattern(notes);
            const json = JSON.stringify(pattern);
            const hasIdx = sng.patterns.findIndex((element) => {
                return JSON.stringify(element) === json;
            })
            if (hasIdx > -1) {
                patternIdx.push(hasIdx);
            }
            else {
                sng.patterns.push(pattern);
                patternIdx.push(sng.patterns.length - 1);
            }
        }
    }

    // Copy patternlist
    const chan1 = [];
    const chan2 = [];
    const chan3 = [];
    for (let i in mod.patterntable) {
        if (i >= mod.songlen) break;
        let pattern1 = mod.patterntable[i] * 4;
        pattern1 = patternIdx[pattern1];
        let pattern2 = (mod.patterntable[i] * 4) + 3;
        pattern2 = patternIdx[pattern2];
        let pattern3 = (mod.patterntable[i] * 4) + 2;
        pattern3 = patternIdx[pattern3];
        chan1.push(pattern1);
        chan2.push(pattern2);
        chan3.push(pattern3);
    }
    sng.subtunes = [
        {
            chan1: Buffer.from(chan1),
            chan2: Buffer.from(chan2),
            chan3: Buffer.from(chan3),
        }
    ]

    console.log('saving sng');
    sng.write('dzdebut.sng');
}
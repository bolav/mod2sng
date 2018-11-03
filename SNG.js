const fs = require('fs');

function SNG() {
    this.songName = '';
    this.author = '';
    this.copyright = '';
    this.subtunes = [];
    this.instruments = [];
    this.wavetable = { left: Buffer.allocUnsafe(0), right: Buffer.allocUnsafe(0) };
    this.pulsetable = { left: Buffer.allocUnsafe(0), right: Buffer.allocUnsafe(0) };
    this.filtertable = { left: Buffer.allocUnsafe(0), right: Buffer.allocUnsafe(0) };
    this.speedtable = { left: Buffer.allocUnsafe(0), right: Buffer.allocUnsafe(0) };
    this.patterns = [];
}

SNG.prototype.onReady = function () {}

SNG.prototype.read = function (file) {
    const asset = this;
    fs.readFile(file, (err, data) => {
        if (err) throw err;
        asset.buffer = data;
        const res = asset.parse();
        console.log('parse returned', res);
    });
}

SNG.prototype.readString = function(size) {
    let str = '';
    let i = this.buffer_idx;
    while (i < this.buffer_idx + size && this.buffer[i] !== 0) {
        str += String.fromCharCode(this.buffer[i]);
        i++;
    }
    this.buffer_idx = this.buffer_idx + size;
    return str;
}

SNG.prototype.readByte = function () {
    this.buffer_idx++;
    return this.buffer[this.buffer_idx - 1];
}

SNG.prototype.readBytes = function (count) {
    this.buffer_idx += count;
    return this.buffer.slice(this.buffer_idx - count, this.buffer_idx);
}

SNG.prototype.readSubtune = function () {
    return {
        chan1: this.readOrderList(),
        chan2: this.readOrderList(),
        chan3: this.readOrderList(),
    }
}

SNG.prototype.readOrderList = function () {
    const orderListN = this.readByte();
    const data = this.readBytes(orderListN + 1);
    return data;
}

SNG.prototype.readInstrument = function () {
    return {
        AD: this.readByte(),
        SR: this.readByte(),
        Wavepointer: this.readByte(),
        Pulsepointer: this.readByte(),
        Filterpointer: this.readByte(),
        VibratoParam: this.readByte(),
        VibraroDelay: this.readByte(),
        Gateoff: this.readByte(),
        HardRestart: this.readByte(),
        InstrumentName: this.readString(16),
    }
}

SNG.prototype.readInstruments = function () {
    const instrument_amount = this.readByte();
    const instruments = [];
    for (let i=0; i < instrument_amount; i++) {
        instruments.push(this.readInstrument());
    }
    return instruments;
}

SNG.prototype.readTable = function () {
    const rows = this.readByte();
    return {
        left: this.readBytes(rows),
        right: this.readBytes(rows),
    }
}

SNG.prototype.readPatterns = function () {
    const patternsN = this.readByte();
    const patterns = [];
    for (let i=0; i<patternsN; i++) {
        const patternLength = this.readByte();
        patterns.push(this.readBytes(patternLength * 4));
    }
    return patterns;
}

SNG.prototype.parse = function () {
    if (!this.buffer) {
        console.error('No buffer');
        return false;
    }
    this.buffer_idx = 0;
    this.signature = this.readString(4);
    if (this.signature !== 'GTS5') {
        console.error('Illegal signature ', this.signature);
        return false;
    }

    this.songName = this.readString(32);
    this.author = this.readString(32);
    this.copyright = this.readString(32);
    const subtunesN = this.readByte();
    this.subtunes = [];
    for (let i = 0; i < subtunesN; i++) {
        this.subtunes.push(this.readSubtune());
    }
    this.instruments = this.readInstruments();
    this.wavetable = this.readTable();
    this.pulsetable = this.readTable();
    this.filtertable = this.readTable();
    this.speedtable = this.readTable();

    this.patterns = this.readPatterns();
    
    this.onReady();
    return true;
}

SNG.prototype.writeString = function (str, length) {
    const buf = Buffer.allocUnsafe(length);
    if (str.length > length) {
        str = str.substring(0, length);
    }
    for (let j=0; j < str.length; j++) {
        buf[j] = str.charCodeAt(j);
    }
    for (let j=str.length; j < length; j++) {
        buf[j] = 0;
    }
    this.buffer = Buffer.concat([this.buffer, buf]);
}

SNG.prototype.writeByte = function (byte) {
    this.buffer = Buffer.concat([this.buffer, Buffer.from([byte])]);
}

SNG.prototype.writeBytes = function (bytes) {
    this.buffer = Buffer.concat([this.buffer, bytes]);
}

SNG.prototype.writeSubtune = function (subtune) {
    this.writeOrderList(subtune.chan1);
    this.writeOrderList(subtune.chan2);
    this.writeOrderList(subtune.chan3);
}

SNG.prototype.writeOrderList = function (orderList) {
    this.writeByte(orderList.length - 1);
    this.writeBytes(orderList);
}

SNG.prototype.writeInstruments = function () {
    this.writeByte(this.instruments.length);
    for (let i in this.instruments) {
        this.writeInstrument(this.instruments[i]);
    }
}

SNG.prototype.writeInstrument = function (instrument) {
    this.writeByte(instrument.AD);
    this.writeByte(instrument.SR);
    this.writeByte(instrument.Wavepointer);
    this.writeByte(instrument.Pulsepointer);
    this.writeByte(instrument.Filterpointer);
    this.writeByte(instrument.VibratoParam);
    this.writeByte(instrument.VibraroDelay);
    this.writeByte(instrument.Gateoff);
    this.writeByte(instrument.HardRestart);
    this.writeString(instrument.InstrumentName, 16);
}

SNG.prototype.writeTable = function (table) {
    this.writeByte(table.left.length);
    this.writeBytes(table.left);
    this.writeBytes(table.right);
}

SNG.prototype.writePatterns = function () {
    this.writeByte(this.patterns.length);
    for (let i in this.patterns) {
        this.writeByte(this.patterns[i].length / 4);
        this.writeBytes(this.patterns[i]);
    }
}

SNG.prototype.write = function (filename) {
    this.buffer = Buffer.allocUnsafe(0);
    this.writeString('GTS5', 4);
    this.writeString(this.songName, 32);
    this.writeString(this.author, 32);
    this.writeString(this.copyright, 32);

    this.writeByte(this.subtunes.length);
    for (let i in this.subtunes) {
        this.writeSubtune(this.subtunes[i]);
    }
    this.writeInstruments();
    this.writeTable(this.wavetable);
    this.writeTable(this.pulsetable);
    this.writeTable(this.filtertable);
    this.writeTable(this.speedtable);
    this.writePatterns();

    fs.writeFile(filename, this.buffer, function (err) {
        console.log('writeFile done', err);
    });
}

module.exports = SNG;
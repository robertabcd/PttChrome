const fs = require('fs');
const child_process = require('child_process');

function build(table, fn) {
    let t = new Uint8Array(2 * 256 * 256);
    let n = 0;
    for (let pos in table) {
        let code = table[pos];
        if (pos > 0xffff || code > 0xffff)
            throw "Code too large: 0x" + code.toString(16);
        t[2 * pos] = code >> 8;
        t[2 * pos + 1] = code & 0xff;
        n++;
    }

    let pct = 100.0 * n / (t.length/2);
    console.log(fn + ': ' + pct + '% filled');

    fs.writeFileSync(fn, Buffer.from(t), { mode: 0o644 });
}

function readTable(fn) {
    let m = {};
    let s = fs.readFileSync(fn).toString();
    for (let line of s.split(/\r?\n/)) {
        if (line.length === 0 || line.match(/^#/))
            continue;
        let p = line.match(/^0x([0-9a-f]+)\s+0x([0-9a-f]+)$/i);
        if (!p)
            throw 'Invalid line format: ' + line;
        m[parseInt(p[1], 16)] = parseInt(p[2], 16);
    }
    return m;
}

child_process.execFileSync('tar', ['-C', __dirname, '-xjf', __dirname + '/big5data.tar.bz2']);
build(readTable(__dirname + '/uao250-b2u.big5.txt'), __dirname + '/../b2u_table.bin');
build(readTable(__dirname + '/uao250-u2b.big5.txt'), __dirname + '/../u2b_table.bin');
child_process.execFileSync('rm', [
    '-f',
    __dirname + '/uao250-b2u.big5.txt',
    __dirname + '/uao250-u2b.big5.txt',
    __dirname + '/ambcjk.big5.txt'
]);

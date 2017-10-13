let fs = require('fs');
let debug = false;

function build(table, fn) {
    let t = new Uint8Array(2 * 256 * 256);
    let n = 0;
    for (let k in table) {
        let pos = (parseInt(k.substring(1, 3), 16) << 8) | parseInt(k.substring(3, 5), 16);
        let s = table[k];
        let code = s.charCodeAt(0);
        let hi = code >> 8, lo = code & 0xff;
        if (hi > 0) {
            if (s.length != 1)
                throw "s.length must be 1 but it is " + s.length;
        } else {
            hi = lo;
            lo = s.charCodeAt(1);
            if (lo > 0xff)
                throw 'lo = ' + lo + ', > 0xff';
        }
        if (debug) {
            console.log(k + '(' + pos + '): ' + hi.toString(16) + ', ' + lo.toString(16));
        }
        t[2 * pos] = hi;
        t[2 * pos + 1] = lo;
        n++;
    }

    let pct = 100.0 * n / (t.length/2);
    console.log(fn + ': ' + pct + '% filled');

    fs.writeFileSync(fn, Buffer.from(t), { mode: 0o644 });
}

window = {lib: {}};
eval(fs.readFileSync(__dirname + '/../js/b2u_table.js').toString());
eval(fs.readFileSync(__dirname + '/../js/u2b_table.js').toString());
build(window.lib.b2uTable, __dirname + '/b2u_table.bin');
build(window.lib.u2bTable, __dirname + '/u2b_table.bin');

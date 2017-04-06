﻿var Morse = (function() {
    var codes = {
        a: '.-',
        b: '-...',
        c: '-.-.',
        d: '-..',
        e: '.',
        f: '..-.',
        g: '--.',
        h: '....',
        i: '..',
        j: '.---',
        k: '-.-',
        l: '.-..',
        m: '--',
        n: '-.',
        o: '---',
        p: '.--.',
        q: '--.-',
        r: '.-.',
        s: '...',
        t: '-',
        u: '..-',
        v: '...-',
        w: '.--',
        x: '-..-',
        y: '-.--',
        z: '--..',
        0: '-----',
        1: '.----',
        2: '..---',
        3: '...--',
        4: '....-',
        5: '.....',
        6: '-....',
        7: '--...',
        8: '---..',
        9: '----.',
        '.': '.-.-.-',
        ',': '--..--',
        '?': '..--..',
        '!': '-.-.--',
        '`': '.----.',
        '/': '-..-.',
        '&': '.-...',
        ':': '---...',
        ';': '-.-.-.',
        '=': '-...-',
        '+': '.-.-.',
        '-': '-....-',
        '(': '-.--.',
        ')': '-.--.-',
        '_': '..--.-',
        '"': '.-..-.',
        '$': '...-..-',
        '@': '.--.-.',
        error: '........'
    };

    // длительности сигналов и пауз, один символ соответствует TIME_UNIT,
    // '=' - сигнал есть, '.' - сигнала нет
    var lengthOf = {
        '.': '=',
        '-': '==='
    };
    var spaceBetween = {
        letterParts: '.',
        letters: '...',
        words: '.......'
    };

    var TIME_UNIT = 100;

    var context = new AudioContext();

    var oscillator = context.createOscillator();
    oscillator.frequency.value = 800;
    oscillator.start(0);

    function getTiming(str) {
        str = str.toLowerCase();

        var timing = [];

        for (var i = 0; i < str.length; i++) {
            var c = str[i];
            if (c === ' ') {
                timing.push(spaceBetween.words);
            } else {
                var letterParts = (codes[c] || codes.error).split('');
                timing.push(letterParts.map(function(n) {
                    return lengthOf[n];
                }).join(spaceBetween.letterParts));

                if (str[i + 1] !== ' ' && i + 1 !== str.length) {
                    timing.push(spaceBetween.letters);
                }
            }
        }

        return timing.join('');
    }

    function playNext(str) {
        if (str) {
            var count = 0,
                character = str[0],
                signalOn = character === '=';

            for (; str[count] === character; count++) ;

            if (signalOn) {
                oscillator.connect(context.destination);
            }

            setTimeout(function() {
                if (signalOn) {
                    oscillator.disconnect(context.destination);
                }

                playNext(str.slice(count));
            }, TIME_UNIT * count);
        }
    }

    return {
        play: function(str) {
            playNext(getTiming(str));
        },
        encode: function(str) {
            str = str.toLowerCase();

            var encoded = [];

            for (var i = 0; i < str.length; i++) {
                var c = str[i];
                if (codes.hasOwnProperty(c)) {
                    encoded.push(codes[c]);
                } else if (c !== ' ') {
                    encoded.push(codes.error);
                }

                encoded.push(' ');
            }

            return encoded.join('').trim();
        },
        decode: function(str) {
            var decoded = [],
                buffer = [];

decoding:
            for (var i = 0; i <= str.length; i++) {
                var c = str[i];
                if (c === '.' || c === '-') {
                    buffer.push(c);
                } else {
                    if (!buffer.length) {
                        decoded.push(' ');
                        continue;
                    }

                    var t = buffer.join('');
                    buffer = [];
                    for (var j in codes) {
                        if (codes[j] === t) {
                            decoded.push(j);
                            continue decoding;
                        }
                    }
                    decoded.push('#'); // error??
                }
            }

            return decoded.join('');
        }
    }
})();

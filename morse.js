var Morse = (function() {
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

    // длительности сигналов и пауз, один символ соответствует timeUnit,
    // '1' - сигнал есть, '0' - сигнала нет
    var lengthOf = {
        '.': '1',
        '-': '111'
    };
    var spaceBetween = {
        letterParts: '0',
        letters: '000',
        words: '0000000'
    };

    var timeUnit = 100,
        nowPlaying = null,
        signalOn = false;

    var context = new AudioContext();

    var oscillator = context.createOscillator();
    oscillator.frequency.value = 800;
    oscillator.start(0);

    function signal(on) {
        on = !!on;
        if (signalOn !== on) {
            signalOn = on;
            oscillator[on ? 'connect' : 'disconnect'](context.destination);
        }
    }

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

    function play(str) {
        if (str && nowPlaying) {
            var count = 0,
                character = str[0],
                isSignal = character === '1';

            for (; str[count] === character; count++) ;

            signal(isSignal);

            setTimeout(function() {
                play(str.slice(count));
            }, timeUnit * count);
        } else {
            stop();
        }
    }

    function stop() {
        if (nowPlaying) {
            dispatchEvent('morse-signal-off', {
                message: nowPlaying
            });

            nowPlaying = null;
            signal(false);
        }
    }

    function download(o) {
        var channels = o.channels || 1,
            sampleRate = o.sampleRate || (self.frequency * 2.5),
            bitsPerSample = o.bitsPerSample || 16,
            amplitude = o.amplitude || 32767,
            frequency = o.frequency || self.frequency,
            samplesInTimeUnit = parseInt(sampleRate * ((o.timeUnit || self.timeUnit) / 1000)),
            timing = getTiming(o.message || '');

        var data = [],
            samples = 0;

        for (var t = 0, i = 0; i < timing.length; i++) {
            var signalOn = timing[i] === '1';

            for (var j = 0; j < samplesInTimeUnit; j++, t++) {
                for (var c = 0; c < channels; c++) {
                    var v = signalOn ? amplitude * Math.sin(2 * Math.PI * frequency / sampleRate * t) : 0;
                    data.push(pack(v));
                    samples++;
                }
            }
        }

        var chunk1 = [
            'fmt ',
            pack(16, true), // Оставшаяся длина подцепочки
            pack(1), // Аудио формат
            pack(channels),
            pack(sampleRate, true),
            pack(sampleRate * channels * bitsPerSample / 8, true), // Количество байт на секунду воспроизведения
            pack(channels * bitsPerSample / 8), // Количество байт на сэмпл, по всем каналам
            pack(bitsPerSample)
        ].join('');

        var chunk2 = [
            'data',
            pack(samples * bitsPerSample / 8, true), // Количество байт в области данных
            data.join('')
        ].join('');

        var audioData = 'data:audio/wav;base64,' + escape(btoa([
            'RIFF',
            pack(4 + chunk1.length + chunk2.length, true), // Размер оставшейся части файла, начиная с этой позиции
            'WAVE',
            chunk1,
            chunk2
        ].join('')));

        var a = document.createElement('a');
        a.href = audioData;
        a.download = (o.fileName || o.message) + '.wav';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(audioData);  
        }, 0); 
    }

    function pack(val, isLong) {
        return isLong
            ? String.fromCharCode(val & 255, (val >> 8) & 255, (val >> 16) & 255, (val >> 24) & 255)
            : String.fromCharCode(val & 255, (val >> 8) & 255);
    }

    function dispatchEvent(name, data) {
        document.dispatchEvent(new CustomEvent(name, {
            detail: data
        }));
    }

    var self = {
        get frequency() {
            return oscillator.frequency.value;
        },
        set frequency(value) {
            oscillator.frequency.value = value;
        },
        get timeUnit() {
            return timeUnit;
        },
        set timeUnit(value) {
            value = +value;
            if (isNaN(value)) {
                throw new TypeError("Failed to set 'timeUnit' property on 'Morse': Invalid value.");
            }

            timeUnit = value;
        },
        get WPM() {
            return Math.round(1200 / timeUnit);
        },
        set WPM(value) {
            timeUnit = Math.round(1200 / value);
        },
        isPlaying: function() {
            return !!nowPlaying;
        },
        play: function(str) {
            if (!nowPlaying && str) {
                nowPlaying = str;

                dispatchEvent('morse-signal-on', {
                    message: nowPlaying
                });

                play(getTiming(str));
            }
        },
        stop: stop,
        download: download,
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
    };

    return self;
})();

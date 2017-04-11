# Азбука Морзе

Реализация транслятора азбуки Морзе. [Демо](https://0xd34f.github.io/morse/).

### Трансляция текста в звуковые сигналы

```
Morse.play('SOS');
```

### Остановка трансляции

```
Morse.stop();
```

### Установка частоты звука

```
Morse.frequency = 1000;
```

Задаётся в герцах.

Дефолтное значение: 800.

### Установка скорости воспроизведения

Скорость воспроизведения определяется единицей вермени - длительностью звучания одной точки, в миллисекундах (длительность тире - три единицы, пауз - одна, три и семь единиц между элементами одного знака, знаками и словами соответственно).

Задать скорость можно двумя способами - напрямую, определив единицу времени:

```
Morse.timeUnit = 50;
```

Либо через количество передаваемых слов в минуту (WPM - words per minute):

```
Morse.WPM = 15;
```

В последнем случае единица времени будет расчитана по формуле timeUnit = 1200 / WPM (разумеется, WPM является усреднённым значением, ожидать что количество передаваемых в минуту слов будет точно соответствовать указанному не следует).

Дефолтное значение timeUnit: 100.

### Генерирование wav-файла и его скачивание

```
Morse.download({
    message: 'Hello, world!',
    ...
})
```
В качестве единственного параметра принимает объект настроек, доступны следующие свойства (значения по умолчанию указаны в скобках):

* `message`: текст, который надо транслировать в wav-файл
* `frequency`: частота сигнала (текущее значение Morse.frequency)
* `timeUnit`: единица времени (текущее значение Morse.timeUnit)
* `channels`: количество каналов (1)
* `sampleRate`: частота дискретизации ((frequency или текущее значение Morse.frequency) * 2.5)
* `bitsPerSample`: количество бит на один сэмпл (16),
* `amplitude`: амплитуда (32767)
* `fileName`: имя выходного файла (совпадает со строкой message)

### Перевод текста в символы азбуки Морзе

```
Morse.encode('SOS'); // "... --- ..."
```

### Перевод символов азбуки Морзе в текст

```
Morse.decode('.... . .-.. .-.. ---'); // "hello"
```

---
path: "/java-byte"
date: "2019-04-14"
title: "Java Bytes are Weird"
tags: ['Java']
---
I learned today that Java's `byte` type is kind of strange and inconvenient to work with. Unlike in other languages, it's treated as a signed, rather than unsigned, 8-bit int, ranging from -128 to 127.

When you're dealing with a stream of raw bytes, you often want to decode them into a multi-byte type like a 32-bit unsigned or signed integer. This is made slightly inconvenient by Java's treatment of `byte`s as signed.

For example, let's say we're decoding a binary stream and we need to unpack the next four bytes into a 32-bit integer. We read in four bytes and wind up with `01000000    10000000   00100000   00000001`.

If bytes were unsigned, we would treat the four bytes as the integers 64, 128, 32, and 1, respectively. But Java interprets them as _signed_ 8-bit integers. Signed integers are represented using [two's complement](https://www.cs.cornell.edu/~tomf/notes/cps104/twoscomp.html). If you're unfamiliar with this, it means that the leftmost bit doesn't represent 128, but rather -128 (`10000000` is the lowest possible number, `10000001` is the second lowest number, etc.). So Java will interpret this four-byte string as 64, -128, 32, and 1.

Now, we don't really want to interpret these bits as four 8-bit numbers anyway, we want to convert them into the single 32-bit number `10000000010000000010000000000001`, which equals `2^31 + 2^22 + 2^13 + 2^0`.

To do this conversion, we can read each byte and convert it to a 32-bit integer that is padded on the left and right sides with 0s so that it goes into its proper spot in the 32-bit integer, then combine them all together using a bitwise OR.

Here's what will happen to each byte, with the padding noted in parentheses

```
b1:  01000000  (00000000  00000000  00000000) |
b2: (00000000)  10000000 (00000000  00000000) |
b3: (00000000   00000000) 00100000 (00000000) |
b4: (00000000   00000000  00000000) 00000001
```

But how do we apply this padding in code? What we _ought_ to be able to do is simply shift the leftmost/first byte in the array to the left by 24 bits; the second item by 16 bits; and the third item by 8 bits, which will give us the padded representations above. The bit-shifting implicitly converts each byte to a 32-bit integer (the `int` type in Java).

But remember that Java considers the bytes to be signed integers. So when we convert each item in a 32-bit integer, Java will make sure the `byte` version of the value is equal to the `int` version of the value.

Remember how Java wants to represent the second byte, 10000000, as -128 instead of 128? If we want to represent -128 in 32-bits, we need `11111111 10000000 00000000 00000000`, which is what Java will convert the `byte` to as soon as it becomes an `int`. This will prevent our bit-shifting plan from working out correctly because it'll end up _subtracting_ 128 * 2^15 from our total instead of adding it.

So before we shift the bits, we need to chop off all the extra 1s on the left. The standard way to do this is to take each `byte` and apply `& 0xFF` to it. `0xFF` is `00000000 00000000 00000000 11111111` so it'll both convert the `byte` to a 32-bit int and mask out all of the bits higher than the original byte, turning it back into a positive number if it wasn't before.

```
original byte as 32-bit int:  11111111 11111111 11111111 10000000 &
        255 as 32-bit int:   00000000 00000000 00000000 11111111
                           = 00000000 00000000 00000000 10000000 
```

Finally, the result can just be shifted the required number of bits!
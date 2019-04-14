---
path: "/double-pointers"
date: "2019-04-13"
title: "Double Pointer All The Way Across the Sky! What Does this Mean?"
tags: ['C']
excerpt: "What are double pointers used for in C?"
---
In my early dabblings in C, I've been a little baffled by a pattern I kept seeing: functions that take double pointers (pointers to pointers), like this: `int readDBRecord(int id, DBRecord **record)`.

A quick aside: for my examples I'll discuss a function like this that is meant to locate a database record by ID and give the caller access to its data. Here's a simple struct that could represent `DBRecord`:

```
typedef struct DBRecord {
    int id;
    char *value;
} DBRecord;
```

It turns out these double pointers are serving as output parameters - they allow the caller to get access to some data that the called function places in the heap.

Why not just use the return value for this? Well, C doesn't have exceptions, and it onl lets you return one value per function. So the return value is often tied up signalling whether an operation succeeded or failed. It's nice for the return value to indicate whether the operation succeeded so you can write blocks like this that call the function and check the return value in a single line:

```
int ret;
if ((ret = readDBRecord(1, &record)) != 0)
    return ret;
```

If we're already using the return value, we need to do something tricky to get data back to the caller. (One option would be for `readDBRecord` to return some kind of `DBRecordWithError` struct, but that would be despicable.) The caller can be responsible for passing the function some location in memory that the called function can use to store the data it wants to pass back.

A single pointer _could_ achieve this goal (but with a drawback, which I'll get to). The caller could allocate an address on the heap to store the `DBRecord`, then it could pass that heap address to the function, which would in turn store the `DBRecord` data in that location. After the function was done, the caller would be able to find the full `DBRecord` data in the space it requested.

```
void main()
{
    DBRecord *record = malloc(sizeof(DBRecord));
    readDBRecord(1, record);
    // Normally, we'd check the error, but not today
    puts(record->value);
}

int readDBRecord(int id, DBRecord *record)
{
    record->id = id;
    record->value = "Love is a Battlefield";
    return 0;
}
```

In order for this function to store the data it needs to store somewhere where the caller will be able to find it, the memory address of this data must already be initialized by the caller. If the memory for `DBRecord` were allocated in `readDBRecord`, there'd be no way for `readDBRecord` to tell its caller where that data went.

In this case, this is an inconvenience for the caller. But in other cases, the caller may not be capable of determining how much memory needs to be allocated for `readDBRecord` to do what it needs to do. For example, what if we were dealing with a function that initializes a variable amount of memory to store something like an array? In this case, we'd have no choice but to use a double pointer so the called function could be responsible for allocating the right amount of memory:

```
void main()
{
    char *recordValue;
    readDBRecordValue(1, &recordValue);
    puts(recordValue);
}

int readDBRecordValue(int id, DBRecord **record)
{
    int recordSize = getRecordSize();
    *record = malloc(sizeof(char) * recordSize);
    *record = getRecordData();
    return 0;
}
```

Now, the `main` function is passing `readDBRecordValue` a pointer to an address _on its own stack_ - that stack address in turn has enough space for a pointer. `main` is telling `readDBRecordValue`, "Hey, please go allocate some space on the heap for whatever data you need me to have access to, and once you have that heap address, store it here, at this address on my stack, so I can use it."

This relates to one other thing that initially confused me about double pointers... Why do we need to first declare a pointer variable, then take its address? When can't we just "cut to the chase" and do this?

```
void main()
{
    char **recordVal;
    readDBRecordVal(1, recordVal);
}
```

Remember, `readDBRecordVal` is going to go follow the pointer to a pointer that's passed to it to in order to make the second pointer point to a chunk of memory it's going to allocate. If we just declare `**recordVal`, the first pointer will just contain uninitialized data - it won't point to any real address. But our goal is to give `readDBRecordVal` some sort of real location that _we_ the callers know about so we can access the data `readDBRecordVal` wants to give us. When we instead declare `*recordVal`, what we're doing is putting space for an address/pointer on the stack frame for the function that's about to call `readDBRecordVal`. Then we can pass `readDBRecordVal` that stack address, where `readDBRecordVal` will in turn write the address of the memory it allocates.

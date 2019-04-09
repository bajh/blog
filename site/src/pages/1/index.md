---
path: "/pointers"
date: "2019-04-09"
title: "C Pointers"
tags: ['C']
excerpt: "Some questions about C Pointers"
---
It seems like many people learn C in school from the ground-up, understanding stack frames and memory segments before they write code that does anything too useful. As someone used to higher level languages who's learning C in a more ad-hoc way, I figured I'd jot down some of the things that stand out to me in the process.

For this post, I wanted to sit down and answer the question, "Why can't I return a pointer to a stack-allocated value?"

And to answer that question, I also needed to answer, "Why are pointers the preferred way to access certain types of data?"

# Heap and Stack

The biggest difference between C and any other language I've used is the manual memory management. In languages like Python, Java or Go, you can accomplish a lot without knowing that there's a distinction between the heap and the stack, and that pointers are even a thing.

If you aren't familiar with the stack and heap, the stack is an area that stores the data necessary for each function to execute.

Every time you call a function, a new stack frame is created to store the function's arguments, any local variables, and other information like the location of the next line of code that needs to be run when the function completes. When a function finishes, its stack frame is removed from the stack because it's no longer needed - at this point its return value might be transferred to somewhere in the stack frame of the function that called it, like to a local variable in the calling function.

The heap, on the other hand, is a separate region of memory where data persists between function calls. Data is only removed from the heap when the programmer specifically calls `free`, passing the data that's no longer needed.

In languages like Python, arrays (and strings, which are arrays of characters) and objects aren't passed to functions directly - instead, they're passed as references to memory addresses (pointers), but the programmer is usually unaware of this, unlike in C, which treats pointers and values as different types. Further, the runtime for higher level languages is responsible for allocating space for arrays and objects in the heap, and, of course, for freeing up the space those objects live in when they aren't needed any more.

But _why_ do these types of data need to be allocated on the heap? Because they need to be passed around as pointers rather than values. as we'll see in the section below, pointers to values on the stack are only good for the duration of the function call. But before we get into that...

# Why are Arrays and Objects Pointers?

For a couple reasons, including:

1) These data structures are often large, and moving them around in the stack space whenever you call a function would be expensive.

Here's a piece of fake Python code that passes a reference variable to a couple functions.

```
def finalize(blog_post_text):
    # ...
    # do other stuff, like edit the text
    # ...
    publish(blog_post_text)

def publish(blog_post_text):
    upload = create_request(blog_post_text)
    # ...
    # do other stuff, like send the request to an FTP server
    # ...

finalize("a bunch of text")
```

So let's look at what would happen if "a bunch of text" was allocated on the stack. Every time a function is called, a stack frame is pushed on top of the stack. As I mentioned, each stack frame holds a few pieces of information necessary for the instructions that make up the function call to find the data they need to operate on.

One of these pieces of information is the data for the arguments that are passed to the function. When each function is called, every argument is copied to a new stack frame. So while `create_request` is being invoked, this is what our stack looks like:

![Copying Arrays as Values to the Stack](/images/stack_value.svg)

This is a problem for reasons of both memory utilization and CPU usage. Imagine that "a bunch of text is", say, 2048 bytes. That means this one string will take up 6144 bytes on the stack while `create_request` is being run. Furthermore, copying all of that data, and then removing the stack frames when the function calls are over, is unnecessary work. In contrast, if the argument is simply a pointer to a place in memory, we only need to push 8 bytes of data onto each stack frame for this argument, as shown below. The function can follow the pointer to locate the string data it needs to use.

![Copying Arrays as Pointers to the Stack](/images/stack_pointer.svg)

2) In Python, strings are immutable, but let's shift over to talking about objects now. We want to be able to modify objects from within function calls, and have those changes be visible to other functions. For example, let's say we have a BlogPost class now, and a primitive proofread function that sets a list of words that have typos on the BlogPost (for simplicity, I made `proofread` a function instead of a method).

```
class BlogPost:
    def __init__(self, text):
        self.text = text
        self.ready = False

def proofread(blog_post):
    typos = [word for word in blog_post.text.split() if word not in dictionary]
    blog_post.ready = len(typos) == 0

def correct(blog_post):
    proofread(blog_post)
    # ...
    # do other stuff, like show the errors and ask user to edit
    # ...
```

Here's an illustration of what would happen if `blog_post` were just a value allocated on the stack. In the first phase, `proofread` gets a copy of the `BlogPost`. In step two, it modifies it, but note that it's only modifying the copy of the value on its own stack. In step three, `proofread` completes, and the value it modified is removed from the stack, so its changes are lost forever.

![Arguments pushed onto the stack cannot be modified in place](/images/stack_modification.svg)

If `blog_post` were allocated on the stack, the only way for the change to the `ready` field to be communicated back to the caller of `proofread` would be if `correct` returned a new `BlogPost`, in functional style.

One interesting aside: some high-level languages actually let the programmer decide whether object-like bundles of data should be allocated on the stack or the heap. In Swift, `struct` types are copied as values to each stack frame, whereas `class` types live in the heap. There are a couple reasons you might want data to not appear on the heap, including that allocating and garbage collecting heap objects is more expensive.

So now we understand why we want to pass around pointers instead of values for these types of data. But this brings us back to our earlier question...

# Why Can't Pointers Just Be on the Stack?

If you want to return a pointer from a function in C, that pointer cannot be to a variable on the stack - it must be to a piece of data on the heap. Here's a piece of code that will cause mayhem (or, just not compile if you have the `-Wreturn-local-addr` flag on).

This surprised me at first because I was already familiar with pointers in Go, which takes care of putting things in the stack or heap for you.

Pretend this `show_post` function is grabbing a post from a database or something and then displaying it. This will NOT work:

```
typedef struct BlogPost {
  int id;
  char *text;
} BlogPost;

struct BlogPost *getPost(int id)
{
  BlogPost post = { .id = id, .text = "hi" };

  return &post;
}

void showPost(int id)
{
  BlogPost *post = getPost(); 
  printf("%s\n", post->text); 
}
```

You can see what happens in the diagram below. The pointer returned by `getPost` is a pointer to a location in the stack. But by the time the caller of that function is able to use the returned pointer, the stack frame where the data was initially stored has been popped. So, what was formerly the stack frame for `getPost` is now dangerous uncharted territory where dragons and bears and people with torsos for hands and hands for torsos roam. No sane person would ever venture to such an unfamiliar land. And no sane person would ever return a stack pointer from a function.

![A stack pointer cannot safely be returned from a function](/images/stack_variable.svg)
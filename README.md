# rxkit
A lightweight, no dependency component kit for reactive programming

## Basic concept

The fundamental mechanism is `Feeders` feeding to `Feedable` targets. A Feedable can be fed with any number of data for
as long as needed. For every feed operation, Feedables return a Promise which resolves if the feed was successful or
rejects if it was not.

A feeding session in which a `Feeder` feeds a `Feedable` is a `PushStream`.

## Feedables

The reactive push concept demands that `Feedables` have no control over the feed they get. If they receive a feed, they
act on it, and indicate the results in the Promise they return on the feed. They have the ability to indicate whether
the feed did or did not succeed for whatsoever reason, but it is always the responsibility of the Feeder and the
reactive upstream chain to handle rejections properly. The reactive concept also demands that Feedables do not maintain
a reference of their feeders. They do not 'subscribe' to data feeds and cannot 'unsubscribe' from them as in event
emitter/listener mechanisms. They can, however, backpressure the upstream chain by rejecting, slow-resolving, or
slow-rejecting feeds. But then again, it is at the upchain's discretion, what to do with backpressures.

## Feeders

`Feeders` act as data pushing agents. Since Feedables are passive receivers, `Feeders` are responsible for setting up feeding sessions. Here is an exmaple how a feeder sets up a feed:
```typescript
const stream = new IntervalFeeder({ interval: 5000 }).feeds(feedable);
```

## The PushStream

Everytime a Feeder starts a new feed, it creates a `PushStream` session. Once setup there are a number of ways the stream
behavior can be manipulated with the following properties and methods:
- `enabled`: the feed mechanism implemented in Feeders checks for this property. If set to false, the PushStream is
  considered to be paused and no more data will be fed until set to true again.
- `resume`: a callback function, which is called when a PushStream enabled state is set to true from false
- `trigger`: some feeders create push streams which are triggerable, which means that they only feed when they receive a
  trigger pulse. Technically, the trigger pulse is a Feedable endpoint to which others can feed the trigger the stream
- `throwsTo(target)`: Set up an alternate Feedable for redirecting feeds that have been rejected by the primary Feedable

In this exmaple the alternate feedable2 gets every item that feedable1 rejected:
```typescript
const stream = new IntervalFeeder().feeds(feedable1).throwsTo(feedable2);
```

## Transmitters

`Transmitters` are special agents which implement both feeder and feedable behaviors. They usualy implement special
arrangements how they feed forward the data they receive: they transform or reduce it, queue up and temporarily hold it, or
implement QoS/backpressure mechanisms.

## Pipes

A `Pipe` is a chain of items where each item feeds the next one in the chain. For this reason, every member implements
both Feeder and Consumer behaviors. In other words, each member of a pipe is a `Transmitter`. The `Pipe` is a powerful
structure which can be built and extended in a chained programming style.
 
Pipes are partly immutable in a way, that they only hold reference to the last item in the queue, and to the PushStream
which feeds to it. Even though Pipes can be extended by adding items at the end, this extension is achieved by creating
a new pipe with the new member as last in queue.
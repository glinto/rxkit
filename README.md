# rkit
Reactive toolkit

## Basic concept
The fundamental mechanism is `Feeders` feeding to `Feedable` targets. A Feedable can be fed with any number of data for as
long as needed. For every feed operation, Feedables return a Promise which resolves if the feed was successful or
rejects if it was not.

A feeding session in which a `Feeder` feeds a `Feedable` is a `PushStream`.

## Feedables
The reactive push concept demands that Feedables have no control over when they are fed to. If they receive a feed, they
act on it, and indicate the results in the Promise they return on the feed. It is always the responsibility of the
Feeder and the reactive upstream chain to handle rejections properly. The reactive concept also demands that Feedables
do not maintain a reference of their feeders. They do not 'subscribe' to data feeds and cannot 'unsubscribe' from them
as in event emitter/listener mechanisms. They can, however, backpressure the upstream chain by rejecting,
slow-resolving, or slow-rejecting feeds. But then again, it is at the upchain's discretion, what to do with
backpressures.

## The `PushStream`
Everytime a Feeder starts a new feed, it creates a PushStream session.

Properties:
- `enabled`: the feed mechanism implemented in Feeders checks for this property. If set to false, the PushStream is 
considered to be paused and no more data will be fed until set to true again.
- `resume()`: called when a PushStream enabled state is set to true from false
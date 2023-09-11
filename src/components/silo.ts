import { PushStream, ConsumeFunction, Feeder, ConsumerBehavior } from "..";



/**
 * A `Silo` acts like a holding tank which consumes data, stores it and
 * release it when it receives a trigger signal. Multiple data can be fed to a
 * `Silo`, and on a trigger signal it will release everything.
 * 
 * The trigger itself is a consumer, to which any feeder can be connected to.
 * To feed to a Silo's trigger, use the `trigger` property to get a `Feedable`
 * endpoint, like this: `myFeeder.feeds(mySilo.trigger)`
 */
export class Silo<T> extends Feeder<T> implements ConsumerBehavior<T> {

    store: T[] = [];

    constructor() {
        super();
    }

    consume(data: T | T[]): Promise<void> {
        if (Array.isArray(data))
            this.store.push(...data);
        else
            this.store.push(data)
        return Promise.resolve();
    }

    get connector(): ConsumeFunction<T> {
        return this.consume.bind(this);
    }

    protected setupFeed(c: ConsumeFunction<T>): PushStream {
        let stream: PushStream = new PushStream();
        stream.trigger = () => this.release(c, stream);
        stream.resume = () => {
            this.release(c, stream)
        };
        return stream;
    }

    protected release(c: ConsumeFunction<T>, stream: PushStream): Promise<void> {
        if (stream.enabled && this.store.length > 0) {
            let data = this.store;
            return this.next(data, c, stream)
                .then(() => {
                    // only empty the store if the feed was successful
                    this.store = [];
                })
                .catch(() => {
                    // Do nothing
                });
        }
        else {
            return Promise.resolve();
        }
    }
}
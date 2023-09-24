/**
 * A `ConsumeFunction` is type of function to which a certain type of data 
 * (single or an array of) can be fed.
 * It returns a `Promise` which resolves if the feed was successful.
 */
export type ConsumeFunction<T> = (data: T | T[]) => Promise<void>;

export interface ConsumerBehavior<T> {
	/**
	 * The intake endpoint in which the `Consumer` consumes data. You normally
	 * don't call this function directly, but rather connect a feeder the
	 * `Consumer`'s `connector` endpoint.
	 * 
	 * Descendant classes of `Consumer` or classes implementing
	 * `ConsumerBehavior` must implement this function to process the received
	 * data.
	 *  
	 */
	consume: ConsumeFunction<T>;

	/**
	 * The endpoint of the `Consumer` to which `Feeder` instances can feed data to.
	 */
	get connector(): ConsumeFunction<T>;
}

/**
 * A Feedable is either a `ConsumeFunction` or an instance of an object with a
 * `ConsumeFunction`
 */
export type Feedable<T> = ConsumerBehavior<T> | ConsumeFunction<T>;

/**
 * The abstract class behind every `Consumer` descendant.
 */
export abstract class Consumer<T> implements ConsumerBehavior<T> {

	abstract consume(data: T | T[]): Promise<void>;

	/**
	 * Returns a bound function of the `Consumer`'s input (consume function).  
	 * `Feeder` instances typically use this `connector` to feed data to a
	 * `Consumer`.
	 */
	get connector(): ConsumeFunction<T> {
		return this.consume.bind(this);
	}
}

export class PushStream {
	protected _enabled: boolean = true;

	/**
	 * If specified, data rejected by the consumer will be fed to this
	 * alternative `Feedable`.
	 */
	throwsToTarget?: Feedable<any>;

	/**
	 * Set up an alternate Feedable for redirecting feeds that have been rejected by the primary Feedable target
	 * 
	 * @param target The alternate Feedable to feed rejects to
	 * @returns Itself for chanining purposes
	 */
	throwsTo(target: Feedable<any>): this {
		this.throwsToTarget = target;
		return this;
	}

	/**
	 * If defined, this method will be called everytime a PushStream enabled state is changed from false to true
	 */
	resume?: () => void = undefined;

	/**
	 * An optional Feedable endpoint which will trigger the stream when it is fed to.
	 */
	trigger?: ConsumeFunction<any>;

	/**
	 * Specifiec if the feeder is active, i.e. feeds data. Feeder sessions must
	 * check this value every time before feeding. When a disabled feed is enabled again, 
	 * the PushStream's `resume()` method will be called
	 */
	get enabled(): boolean {
		return this._enabled;
	}

	set enabled(b: boolean) {
		if (!this._enabled && b && this.resume) {
			this._enabled = b;
			this.resume();
		}
		else {
			this._enabled = b;
		}
	}

}

export interface FeederBehavior<T> {
	feeds(target: Feedable<T>): PushStream;
}

export interface PipeBehavior<I, O> extends ConsumerBehavior<I>, FeederBehavior<O> { }

/**
 * The abstract class behind `Feeder` descendant classes
 */
export abstract class Feeder<T> implements FeederBehavior<T> {

	constructor() {
	}

	static getConsumeFunction<T>(f: Feedable<T>): ConsumeFunction<T> {
		if (typeof f === "function")
			return f;
		else
			return f.connector;
	}

	/**
	 * Sets up a feed to a specific `Consumer`
	 * 
	 * @param target The `Feedable` consumer function or consumer object instance to which this feeder will feed to. 
	 * @param options An object containing options for setting up the feed behavior
	 * 
	 * @returns A `PushStream` which represent the feeding activity
	 */
	feeds(target: Feedable<T>): PushStream {
		return this.setupFeed(Feeder.getConsumeFunction(target));
	}

	/**
	 * Sets up a feed to to another triggerable `PushStream`
	 * 
	 * @param stream The triggerable PushStream to which this feeder will feed to. 
	 * 
	 * @returns A `PushStream` which represent the feeding activity
	 */
	triggers(stream: PushStream): PushStream {
		if (stream.trigger === undefined)
			throw (`${this.constructor.name}: PushStream is not triggerable`);
		return this.setupFeed(stream.trigger);
	}

	/**
	 * Create a Pipe with this feeder as the first item in the chain
	 * 
	 * @param target The target in the pipe which this feeder will feed to
	 * @returns A newly created pipe with this feeder and the target chained together
	 */
	pipe<P>(target: PipeBehavior<T, P>): Pipe<T, P> {
		return new Pipe(this.feeds(target), target);
	}

	/**
	 * This function must be implemented in descendant classes of `Feeder`. It needs to set up
	 * a single activity or a chain of activities in which data will be fed to the a
	 * target consumer.
	 * 
	 * @param c The `Feedable` consumer function or consumer object instance to which this feeder will feed to 
	 */
	protected abstract setupFeed(c: ConsumeFunction<T>): PushStream;

	/**
	 * Implements some common logic for all Feeder descendant classes. 
	 * Attempts to feed one piece (or a set) of data to a consumer target. If the consumer rejects and the PushStream
	 * has defined an alternate `Feedable` in its `throws` property, then a second attempt is made to feed it to that
	 * `Feedable`. The feed is considered successful if either the consumer target or the alternate `Feedable` resolves.
	 * 
	 * It is important for descendant classes to handle unsuccessful feed attempts, because it means the data went 
	 * nowhere. It is then at the descendant class's discretion what to do with rejected data.
	 * 
	 * @param data The data to be fed
	 * @param target The target `ConsumeFunction` to receive the data
	 * @param stream The PushStream in which the feed attempt happens
	 * @returns A Promise which resolves if the feed was successful or rejects if it wasn't
	 */
	protected next(data: T | T[], target: ConsumeFunction<T>, stream: PushStream): Promise<void> {
		return target(data)
			.catch((reason) => {
				if (stream.throwsToTarget !== undefined) {
					return Feeder.getConsumeFunction(stream.throwsToTarget)(data);
				}
				else {
					return Promise.reject(reason);
				}
			})
	}
}

/**
 * A Pipe is a chain of items where each item feeds the next one in the chain. For this reason, every member implements
 * both Feeder and Consumer behaviors. The Pipe is a powerful structure which can be built and extended in a chained
 * programming style.
 * 
 * Pipes are partly immutable in a way, that they only hold reference to the last item in the queue,
 * and to the PushStream which feeds to it. Even though Pipes can be extended by adding items at the end, this
 * extension is achieved by creating a new pipe with the new member as last in queue.
 */
export class Pipe<I, O> {
	constructor(public stream: PushStream, public readonly feeder: PipeBehavior<I, O>) {
	}

	/**
	 * Add a new item at the end of the Pipe
	 * @param target The new member to extend the Pipe with
	 * @returns A new Pipe extended with the new member
	 */
	pipe<P>(target: PipeBehavior<O, P>): Pipe<O, P> {
		return new Pipe<O, P>(this.feeder.feeds(target), target);
	}

	/**
	 * Stream the output of the pipe to a Feedable target.
	 * 
	 * @param target The target to feed to pipe output to
	 * @returns The pipe itself for chaining purposes
	 */
	out(target: Feedable<O>): this {
		this.stream = this.feeder.feeds(target);
		return this;
	}

	/**
	 * Sets up a trigger source for the last PushStream in the pipe (the feeding contract
	 * between the last item in the pipe and the one before it)
	 * 
	 * @param source The Feeder which will act as the trigger source
	 * @returns The pipe itself for chaining purposes
	 */
	triggeredWith(source: FeederBehavior<any>): this {
		if (this.stream.trigger === undefined) throw (`Stream is not triggerable`);
		source.feeds(this.stream.trigger);
		return this;
	}

	/**
	 * Feed rejections of the last PushStream to an alternate target
	 * @param target The target to feed rejections to
	 * @returns The pipe itself for chaining purposes
	 */
	throwsTo(target: Feedable<O>): this {
		this.stream.throwsTo(target);
		return this;
	}

}

export { IntervalFeeder, IntervalFeederOptions } from './components/interval';
export { IteratorFeeder } from './components/iterator';
export { Silo } from './components/silo';
export { Transformer } from './components/transformer';
export { Aggregator, AggregatorFunction } from './components/aggregator';
export { ReadableFeeder } from './components/readable';
export { WritableConsumer } from './components/writable';
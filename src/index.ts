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

function consumeFunction<T>(f: Feedable<T>): ConsumeFunction<T> {
	if (typeof f === "function")
		return f;
	else
		return f.connector;
}

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
export interface PushStreamLike {
	enabled: boolean;
}

export class PushStream implements PushStreamLike {
	protected _enabled?: boolean = true;

	/**
	 * If specified, data rejected by the consumer will be fed to this
	 * alternative `Feedable`.
	 */
	throwsToTarget?: Feedable<any>;

	/**
	 * Factory method to create PushStreams from PushStreamLike objects
	 * @param s The PushStreamLike object to inherit properties from
	 * @returns A new PushStream instance
	 */
	static from(s: PushStreamLike): PushStream {
		let ps = new PushStream();
		ps.enabled = s.enabled;
		return ps;
	}

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
	 * Specifiec if the feeder is active, i.e. feeds data. Feeder sessions must
	 * check this value every time before feeding. When a disabled feed is enabled again, 
	 * the PushStream's `resume()` method will be called
	 */
	get enabled(): boolean {
		return this._enabled || false;
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


/**
 * The abstract class behind `Feeder` descendant classes
 */
export abstract class Feeder<T> implements FeederBehavior<T> {

	constructor() {
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
		return this.setupFeed(consumeFunction(target));
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
					return consumeFunction(stream.throwsToTarget)(data);
				}
				else {
					return Promise.reject(reason);
				}
			})
	}
}

export class TriggeredPushStream extends PushStream {
	constructor(public trigger: ConsumeFunction<any>) {
		super();
	}
}

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

	override feeds(target: Feedable<T>): TriggeredPushStream {
		return this.setupFeed(consumeFunction(target));
	}


	protected setupFeed(c: ConsumeFunction<T>): TriggeredPushStream {
		let stream = new TriggeredPushStream(
			() => {
				if (stream.enabled) {
					let data = this.store;
					this.store = [];
					return c(data);
				}
				else {
					return Promise.resolve();
				}

			}
		);
		return stream;
	}
}

/**
 * Options to control `IntervalFeeder` behavior
 */
export interface IntervalFeederOptions {
	/**
	 * The time interval, in milliseconds, between feeds. Default is 1000.
	 */
	interval?: number;
	/**
	 * Number to start the sequence with. Default is 0.
	 */
	start?: number;
	/**
	 * The increment of the sequence. Default is 1.
	 */
	increment?: number;
}

export class IteratorFeeder<T> extends Feeder<T> {

	constructor(private iterator: Iterator<T>) {
		super();
	}

	protected override setupFeed(c: ConsumeFunction<T>): PushStream {
		let stream = new PushStream();
		this.iterate(stream, c);
		stream.resume = () => {
			this.iterate(stream, c);
		};
		return stream;
	}

	private iterate(stream: PushStream, c: ConsumeFunction<T>) {
		if (!stream.enabled) return;
		let result = this.iterator.next();
		if (result.done === false) {
			this.next(result.value, c, stream)
				.catch(() => {
					// Lose the data if target (and alternate Feedable) both rejected (do nothing)
				})
				.finally(() => {
					setImmediate(() => this.iterate(stream, c));
				});
		}
		else {
			// The iterator source has been exhausted, switch the stream to inactive state
			stream.enabled = false;
		}
	}


}

/**
 * Feeds an incremental sequence of numbers at regular intervals. 
 */
export class IntervalFeeder extends Feeder<number> {

	private intervals: NodeJS.Timer[] = [];

	constructor(protected options?: IntervalFeederOptions) {
		super();
	}

	protected setupFeed(c: ConsumeFunction<number>): PushStream {
		let stream = new PushStream();
		let n = this.options?.start || 0;
		this.intervals.push(
			setInterval(() => {
				if (stream.enabled) {
					this.next(n, c, stream)
						.catch(() => {
							// Lose the data if target (and alternate Feedable) rejected
						})
						.finally(() => {
							n += (this.options?.increment === undefined ? 1 : this.options.increment);
						});
				}
			},
				this.options?.interval || 1000
			)
		);
		return stream;
	}

	/**
	 * Stops all feeds
	 */
	stop(): void {
		this.intervals.forEach((interval) => clearInterval(interval));
	}
}



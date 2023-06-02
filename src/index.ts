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

export type EnableSwitch = boolean | (() => boolean);

export interface PushStream {
	/**
	 * A boolean value, or a function which returns a boolean value. 
	 * If true (or returns true), the feeder will keep feeding data.
	 * False, on the other hand, means the feeder should temporarily
	 * not feed the consumer.
	 */
	enabled: EnableSwitch;
	/**
	 * If specified, data rejected by the consumer will be fed to this
	 * alternative `Feedable`.
	 */
	throws?: Feedable<any>;
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
		return this.feed(consumeFunction(target));
	}

	protected streamEnabled(s: PushStream): boolean {
		if (typeof s.enabled === "boolean") return s.enabled;
		return s.enabled();
	}

	/**
	 * This function must be implemented in descendant classes of `Feeder`. It needs to set up
	 * a single activity or a chain of activities in which data will be fed to the a
	 * target consumer.
	 * 
	 * @param c The `Feedable` consumer function or consumer object instance to which this feeder will feed to 
	 */
	protected abstract feed(c: ConsumeFunction<T>): PushStream;
}

export interface TriggeredPushStream extends PushStream {
	trigger: ConsumeFunction<any>;
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
		return this.feed(consumeFunction(target));
	}


	protected feed(c: ConsumeFunction<T>): TriggeredPushStream {
		let stream: TriggeredPushStream = {
			enabled: true,
			trigger: (): Promise<void> => {
				if (this.streamEnabled(stream)) {
					let data = this.store;
					this.store = [];
					return c(data);
				}
				else {
					return Promise.resolve();
				}

			}
		};
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

/**
 * Feeds an incremental sequence of numbers at regular intervals. 
 */
export class IntervalFeeder extends Feeder<number> {

	private intervals: NodeJS.Timer[] = [];

	constructor(protected options?: IntervalFeederOptions) {
		super();
	}

	protected feed(c: ConsumeFunction<number>): PushStream {
		let stream: PushStream = {
			enabled: true
		};
		let n = this.options?.start || 0;
		this.intervals.push(
			setInterval(() => {
				if (this.streamEnabled(stream)) {
					let data = n;
					c(data).catch(() => {
						if (stream.throws !== undefined) {
							consumeFunction(stream.throws)(data);
						}
					});
					n += (this.options?.increment === undefined ? 1 : this.options.increment);
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

export class Logger<T> extends Consumer<T> {
	consume(data: T | T[]): Promise<void> {
		if ((typeof data === 'number') && (data % 9) === 0)
			return Promise.reject("9!");
		console.log(new Date(), 'Logger', data);
		return Promise.resolve();
	}
}

export class Transform {
	static mapTo<T, U>(transformFunction: (data: T) => U, target: Feedable<U>): ConsumeFunction<T> {
		return (data): Promise<void> => {
			let transformed = Array.isArray(data) ? data.map(transformFunction) : transformFunction(data);
			return typeof target === 'function' ? target(transformed) : target.connector(transformed);
		}
	}
}

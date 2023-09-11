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

export { IntervalFeeder, IntervalFeederOptions } from './components/interval';
export { IteratorFeeder } from './components/iterator';
export { Silo } from './components/silo';
export { Transformer } from './components/transformer';
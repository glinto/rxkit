import { Feeder, ConsumeFunction, PushStream } from "..";

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

	protected setupFeed(c: ConsumeFunction<number>): PushStream {
		let stream = new PushStream();
		let n = this.options?.start || 0;
		this.intervals.push(
			setInterval(() => {
				if (stream.enabled) {
					// temporarily disable the stream to handle slow backpressuring consumers
					stream.enabled = false;
					this.next(n, c, stream)
						.catch(() => {
							// Lose the data if target (and alternate Feedable) rejected
						})
						.finally(() => {
							n += (this.options?.increment === undefined ? 1 : this.options.increment);
							stream.enabled = true;
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

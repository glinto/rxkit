import { Feeder, ConsumeFunction, PushStream } from "..";

/**
 * A `Watchdog` will feed its data after a specified timeout. The timeout can be reset by feeding to 
 * the `trigger` endpoint of the watchdog's stream.	
 * If a timeout occurs, the watchdog will feed the data and disable its feeding stream. A watchdog 
 * with a disabled stream will never fire again, unless its stream is re-enabled, which then will
 * reset the timeout.
 */
export class Watchdog<T> extends Feeder<T> {

	constructor(private timeout: number, private data: T | T[]) {
		super();
	}

	protected override setupFeed(c: ConsumeFunction<T>): PushStream {
		const stream: PushStream = new PushStream();
		let t: NodeJS.Timeout;

		// Rearm the timer
		const arm = () => {
			clearTimeout(t);
			t = setTimeout(() => {
				this.next(this.data, c, stream);
				stream.enabled = false;
			}, this.timeout);
		};

		stream.trigger = async () => {
			arm();
		};
		stream.resume = () => {
			arm();
		};
		stream.pause = () => {
			clearTimeout(t);
		};

		arm();
		return stream;
	}

}
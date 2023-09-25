import { ConsumeFunction, Feeder, ConsumerBehavior, PushStream } from "..";

export interface Transmission<T> {
	stream: PushStream;
	c: ConsumeFunction<T>;
}

/**
 * A Transmitter is a base class which consumes data and forward feeds it to another Feedable.  
 */
export class Transmitter<T> extends Feeder<T> implements ConsumerBehavior<T> {

	private transmissions: Transmission<T>[] = [];

	constructor() {
		super();
	}

	consume(data: T | T[]): Promise<void> {

		if (this.transmissions.length < 1)
			return Promise.reject('No forward feeds in transmitter');
		return this.transmit(data);
	}

	protected transmit(data: T | T[]): Promise<void> {
		return Promise.any(this.transmissions.map((trans) => {
			if (!trans.stream.enabled) return Promise.reject('Disabled stream');
			return this.next(data, trans.c, trans.stream)
		}));
	}

	get connector(): ConsumeFunction<T> {
		return this.consume.bind(this);
	}

	protected setupFeed(c: ConsumeFunction<T>): PushStream {
		let stream = new PushStream();
		this.transmissions.push({
			c: c,
			stream: stream
		});
		return stream;
	}

}
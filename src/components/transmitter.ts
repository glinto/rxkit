import { ConsumeFunction, Feeder, ConsumerBehavior, PushStream } from "..";

export interface Transmission<T> {
	stream: PushStream;
	c: ConsumeFunction<T>;
}

export abstract class TransmitterBase<T> extends Feeder<T> {
	protected transmissions: Transmission<T>[] = [];

	protected transmit(data: T | T[]) {
		if (this.transmissions.length < 1)
			return Promise.reject('No forward feeds in transmitter');
		return Promise.any(this.transmissions.map((trans) => {
			if (!trans.stream.enabled) return Promise.reject('Disabled stream');
			return this.next(data, trans.c, trans.stream)
		}));
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

/**
 * A Transmitter is a base class which consumes data and forward feeds it to another Feedable.  
 */
export class Transmitter<T> extends TransmitterBase<T> implements ConsumerBehavior<T> {

	constructor() {
		super();
	}

	consume(data: T | T[]): Promise<void> {
		return this.transmit(data);
	}

	get connector(): ConsumeFunction<T> {
		return this.consume.bind(this);
	}



}
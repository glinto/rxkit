import { Feeder, ConsumeFunction, PushStream } from "..";

/**
 * An ImmediateFeeder will feed the data on the next event loop tick
 */
export class ImmediateFeeder<T> extends Feeder<T> {

	constructor(private data: T | T[]) {
		super();
	}

	protected override setupFeed(c: ConsumeFunction<T>): PushStream {
		let stream = new PushStream();
		setImmediate(() => this.next(this.data, c, stream));
		return stream;
	}

}
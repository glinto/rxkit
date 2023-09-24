import { ConsumeFunction, Feeder, ConsumerBehavior, PushStream } from "..";

/**
 * A Transformer consumes one data type and feeds another type. 
 */
export class Transformer<I, O> extends Feeder<O> implements ConsumerBehavior<I> {

	protected forwardFeed?: {
		stream: PushStream;
		c: ConsumeFunction<O>;
	}

	constructor(private transformFn: (input: I) => O) {
		super();
	}

	consume(data: I | I[]): Promise<void> {
		if (this.forwardFeed === undefined)
			return Promise.reject();
		if (!this.forwardFeed.stream.enabled)
			return Promise.reject();
		if (Array.isArray(data)) {
			return this.next(data.map(value => this.transformFn(value)), this.forwardFeed.c, this.forwardFeed.stream);
		}
		else {
			return this.next(this.transformFn(data), this.forwardFeed.c, this.forwardFeed.stream);
		}
	}

	get connector(): ConsumeFunction<I> {
		return this.consume.bind(this);
	}

	protected setupFeed(c: ConsumeFunction<O>): PushStream {
		let stream = new PushStream();
		this.forwardFeed = {
			c: c,
			stream: stream
		};
		return stream;
	}

}
import { ConsumeFunction, Feeder, ConsumerBehavior, PushStream } from "../";

export type AggregatorFunction<I, O> = (source: I[]) => O[];

/**
 * An Aggregator transforms a set of data in to another set of data
 */
export class Aggregator<I, O> extends Feeder<O> implements ConsumerBehavior<I> {

	protected forwardFeed?: {
		stream: PushStream;
		c: ConsumeFunction<O>;
	}

	constructor(private aggregatorFn: AggregatorFunction<I, O>) {
		super();
	}

	consume(data: I | I[]): Promise<void> {
		if (this.forwardFeed === undefined)
			return Promise.reject();
		if (!this.forwardFeed.stream.enabled)
			return Promise.reject();
		if (Array.isArray(data)) {
			return this.next(this.aggregatorFn(data), this.forwardFeed.c, this.forwardFeed.stream);
		}
		else {
			return this.next(this.aggregatorFn([data]), this.forwardFeed.c, this.forwardFeed.stream);
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
import { ConsumeFunction, ConsumerBehavior } from "../";
import { TransmitterBase } from "./transmitter";

export type AggregatorFunction<I, O> = (source: I[]) => O[];

/**
 * An Aggregator transforms a set of data in to another set of data
 */
export class Aggregator<I, O> extends TransmitterBase<O> implements ConsumerBehavior<I> {

	constructor(private aggregatorFn: AggregatorFunction<I, O>) {
		super();
	}

	consume(data: I | I[]): Promise<void> {
		return this.transmit(this.aggregatorFn(Array.isArray(data) ? data : [data]));
	}

	get connector(): ConsumeFunction<I> {
		return this.consume.bind(this);
	}

}
import { ConsumeFunction, ConsumerBehavior } from "..";
import { TransmitterBase } from "./transmitter";

/**
 * A Transformer consumes one data type and feeds another type. 
 */
export class Transformer<I, O> extends TransmitterBase<O> implements ConsumerBehavior<I> {


	constructor(private transformFn: (input: I) => O) {
		super();
	}

	consume(data: I | I[]): Promise<void> {
		return this.transmit(Array.isArray(data) ? data.map(x => this.transformFn(x)) : this.transformFn(data));
	}

	get connector(): ConsumeFunction<I> {
		return this.consume.bind(this);
	}


}
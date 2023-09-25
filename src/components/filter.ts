import { ConsumeFunction, ConsumerBehavior } from "..";
import { TransmitterBase } from "./transmitter";

/**
 * A Filter is a transmitter which will forward items which satisfy a filtering condition
 * and will discard items which do not
 */
export class Filter<T> extends TransmitterBase<T> implements ConsumerBehavior<T> {

	constructor(private filterFn: (input: T) => boolean) {
		super();
	}

	consume(data: T | T[]): Promise<void> {
		if (Array.isArray(data)) {
			return this.transmit(data.filter(x => this.filterFn(x)));
		}
		if (this.filterFn(data)) {
			return this.transmit(data);
		}
		return Promise.reject();
	}

	get connector(): ConsumeFunction<T> {
		return this.consume.bind(this);
	}


}
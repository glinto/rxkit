import { Feeder, ConsumeFunction, PushStream } from "..";

/**
 * The IteratorFeeder feeds data from an Iterable source. IteratorFeeders can be back pressured,
 * as with every iteration, they will wait for the previous feed to complete (resolve or reject).
 */
export class IteratorFeeder<T> extends Feeder<T> {

	constructor(private iterator: Iterator<T>) {
		super();
	}

	protected override setupFeed(c: ConsumeFunction<T>): PushStream {
		let stream = new PushStream();
		setImmediate(() => this.iterate(stream, c));
		stream.resume = () => {
			setImmediate(() => this.iterate(stream, c));
		};
		return stream;
	}

	private iterate(stream: PushStream, c: ConsumeFunction<T>) {
		if (!stream.enabled) return;
		let result = this.iterator.next();
		if (result.done === false) {
			this.next(result.value, c, stream)
				.catch(() => {
					// Lose the data if target (and alternate Feedable) both rejected (do nothing)
				})
				.finally(() => {
					setImmediate(() => this.iterate(stream, c));
				});
		}
		else {
			// The iterator source has been exhausted, switch the stream to inactive state
			stream.enabled = false;
		}
	}
}
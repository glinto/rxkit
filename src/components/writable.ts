import { ConsumeFunction, ConsumerBehavior } from "..";

export interface WritableLike {
	write(chunk: any, callback?: ((error: Error | null | undefined) => void) | undefined): boolean;
	readonly writable: boolean;
}

/**
 * A WrtiableConsumer consumes binary data and pushes it to a writable stream.
 */
export class WritableConsumer implements ConsumerBehavior<Buffer> {

	constructor(private writable: WritableLike) {

	}

	consume(data: Buffer | Buffer[]): Promise<void> {

		return new Promise((resolve, reject) => {
			if (this.writable.writable) {
				this.writable.write(Array.isArray(data) ? Buffer.concat(data) : data, (err) => {
					if (err) reject(err);
					resolve();
				});
			}
			else {
				reject('Stream no longer writable');
			}
		});
	}


	get connector(): ConsumeFunction<Buffer> {
		return this.consume.bind(this);
	}
}
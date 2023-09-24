import { Writable } from "stream";
import { ConsumeFunction, ConsumerBehavior } from "..";

/**
 * A WrtiableConsumer consumes binary data and pushes it to a writable stream.
 */
export class WritableConsumer implements ConsumerBehavior<Buffer>{

	constructor(private writable: Writable) {

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
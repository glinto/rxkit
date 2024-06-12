import { Feeder, ConsumeFunction, PushStream } from "..";

interface ReadableLike {
	on(event: "data", listener: (chunk: any) => void): ReadableLike;
}

/**
 * A ReadableFeeder feeds byte data arriving from a Readble stream.
 */
export class ReadableFeeder extends Feeder<Buffer> {

	constructor(private reader: ReadableLike) {
		super();
	}

	protected override setupFeed(c: ConsumeFunction<Buffer>): PushStream {
		let stream = new PushStream();
		this.reader.on('data', (chunk) => {
			let data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
			if (stream.enabled) {
				this.next(data, c, stream)
					.catch(() => {
						// Lose the data
					});
			}
			else {
				// Lose the data
			}
		});
		return stream;
	}
}
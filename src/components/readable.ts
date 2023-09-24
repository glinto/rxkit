import { Readable } from "stream";
import { Feeder, ConsumeFunction, PushStream } from "..";

/**
 * A ReadableFeeder feeds byte data arriving from a Readble stream.
 */
export class ReadableFeeder extends Feeder<Buffer> {

    constructor(private reader: Readable) {
        super();
    }

    protected override setupFeed(c: ConsumeFunction<Buffer>): PushStream {
        let stream = new PushStream();
        this.reader.on('data', (chunk) => {
            let data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            if (stream.enabled) {
                this.next(data, c, stream);
            }
            else {
                // Lose the data
            }
        });
        return stream;
    }
}
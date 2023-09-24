import { setTimeout } from "timers/promises";
import { IteratorFeeder, WritableConsumer } from "../src";
import { PassThrough } from "stream";

describe('WritableConsumer', () => {

	it('Consume', () => {
		let fn = jest.fn();
		let p = new PassThrough();

		let w = new WritableConsumer(p);
		p.on('data', (data) => { fn(data.toString('hex')) });

		new IteratorFeeder([Buffer.from([1, 2, 3]), Buffer.from([255, 254])].values()).feeds(w);

		return setTimeout(100)
			.then(() => {
				expect(fn).toBeCalledTimes(2);
				expect(fn).toHaveBeenNthCalledWith(1, '010203');
				expect(fn).toHaveBeenNthCalledWith(2, 'fffe');
			});
	});

	it('Ended stream rejects', () => {
		let fn = jest.fn();
		let p = new PassThrough();

		let w = new WritableConsumer(p);
		p.on('data', (data) => { fn(data.toString('hex')) });

		p.end();

		return expect(w.consume(Buffer.from([1, 2]))).rejects.toBe('Stream no longer writable');

	});

});
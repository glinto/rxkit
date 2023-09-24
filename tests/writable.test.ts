import { setTimeout } from "timers/promises";
import { IteratorFeeder, WritableConsumer } from "../src";
import { PassThrough, Writable } from "stream";

class writableWithErroCb {

	writable = true;

	static writeError = new Error('boo');

	write(_chunk: any, callback: ((error: Error | null | undefined) => void)): boolean {
		callback(writableWithErroCb.writeError);
		return true;
	}
}

describe('WritableConsumer', () => {

	it('Consume', () => {
		let fn = jest.fn();
		let p = new PassThrough();

		let w = new WritableConsumer(p);
		p.on('data', (data) => { fn(data.toString('hex')) });

		w.consume([Buffer.from([1, 2, 3])]);
		new IteratorFeeder([Buffer.from([255, 254])].values()).feeds(w);

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

		expect(fn).toHaveBeenCalledTimes(0);
		return expect(w.consume(Buffer.from([1, 2]))).rejects.toBe('Stream no longer writable');
	});

	it('Writable callback throws', () => {
		let w = new WritableConsumer(new writableWithErroCb() as Writable);
		return expect(w.consume(Buffer.from([1, 2]))).rejects.toBe(writableWithErroCb.writeError);
	});



});
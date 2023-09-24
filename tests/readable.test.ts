import { setTimeout } from "timers/promises";
import { ConsumeFunction, ReadableFeeder } from "../src";
import { Readable } from "stream";

describe('ReadableFeeder', () => {

	it('Feed', () => {
		let fn = jest.fn();
		let c: ConsumeFunction<Buffer> = (b) => {
			fn(b.toString('hex'));
			return Promise.resolve();
		};
		let f1 = new ReadableFeeder(Readable.from('ABC'));
		let f2 = new ReadableFeeder(Readable.from(Buffer.from([1, 2, 3])));

		f1.feeds(c);
		f2.feeds(c);

		return setTimeout(100)
			.then(() => {
				expect(fn).toBeCalledTimes(2);
				expect(fn).toHaveBeenNthCalledWith(1, '414243');
				expect(fn).toHaveBeenNthCalledWith(2, '010203');
			});
	});

	it('Feed disabled', () => {
		let fn = jest.fn();
		let c: ConsumeFunction<Buffer> = (b) => {
			fn(b.toString('hex'));
			return Promise.resolve();
		};
		let f1 = new ReadableFeeder(Readable.from('ABC'));

		f1.feeds(c).enabled = false;

		return setTimeout(100)
			.then(() => {
				expect(fn).toBeCalledTimes(0);
			});
	});


});
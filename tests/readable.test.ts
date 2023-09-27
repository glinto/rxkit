import { ConsumeFunction, ReadableFeeder } from "../src";
import { PassThrough, Readable } from "stream";
import { immediatePromise } from "./test.common";

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

		return immediatePromise()
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

		return immediatePromise()
			.then(() => {
				expect(fn).toBeCalledTimes(0);
			});
	});

	it('Lose rejected feed', () => {
		let fn = jest.fn();
		let c: ConsumeFunction<Buffer> = (b) => {
			let str = b.toString('hex');
			if (str === '414243') return Promise.reject();
			fn(str);
			return Promise.resolve();
		};

		let p = new PassThrough();
		new ReadableFeeder(p).feeds(c);

		p.push('ABC');
		p.push('DE');

		return immediatePromise()
			.then(() => {
				expect(fn).toBeCalledTimes(1);
				expect(fn).toHaveBeenLastCalledWith('4445');
			});
	});


});
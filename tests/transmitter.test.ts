import { setTimeout } from "timers/promises";
import { ConsumeFunction, Feeder, PushStream, Transmitter } from "../src";

class SimpleFeeder extends Feeder<number> {

	constructor(private data: number | number[], private success?: jest.Mock, private failure?: jest.Mock) {
		super();
	}

	protected setupFeed(c: ConsumeFunction<number>): PushStream {
		const s = new PushStream();
		this.next(this.data, c, s)
			.then(() => {
				if (this.success !== undefined) this.success(this.data);
			})
			.catch((err) => {
				if (this.failure !== undefined) this.failure(err);
			})
		return s;
	}
}

describe('Transmitter', () => {
	it('Feed', () => {
		const fn = jest.fn();
		const t = new Transmitter<number>();
		t.feeds((n) => {
			fn(n);
			return Promise.resolve();
		});
		t.feeds((n) => {
			fn(n);
			return Promise.resolve();
		});

		new SimpleFeeder(13).feeds(t);

		return setTimeout(20)
			.then(() => {
				expect(fn).toBeCalledTimes(2);
				expect(fn).toHaveBeenNthCalledWith(1, 13);
				expect(fn).toHaveBeenNthCalledWith(2, 13);
			});
	});

	it('Feed dangling', () => {
		const t = new Transmitter<number>();
		let fnsuccess = jest.fn();
		let fnfail = jest.fn();

		new SimpleFeeder(13, fnsuccess, fnfail).feeds(t);

		return setTimeout(20)
			.then(() => {
				expect(fnsuccess).toBeCalledTimes(0);
				expect(fnfail).toBeCalledTimes(1);
				expect(fnfail).toHaveBeenNthCalledWith(1, 'No forward feeds in transmitter');
			});
	});

	it('Feed disabled', () => {
		const t = new Transmitter<number>();
		let lastError: any;
		let fn = jest.fn();
		let fnfail = jest.fn().mockImplementation((args) => { lastError = args });

		t.feeds((n) => {
			fn(n);
			return Promise.resolve();
		}).enabled = false;

		new SimpleFeeder(13, undefined, fnfail).feeds(t);

		return setTimeout(20)
			.then(() => {
				expect(fn).toBeCalledTimes(0);
				expect(fnfail).toBeCalledTimes(1);
				expect((lastError.errors)).toEqual(['Disabled stream']);
			});
	});
});
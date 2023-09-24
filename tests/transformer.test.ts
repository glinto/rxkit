import { setTimeout } from "timers/promises";
import { ConsumeFunction, Feeder, PushStream, Transformer } from "../src";

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
			.catch(() => {
				if (this.failure !== undefined) this.failure(this.data);
			})
		return s;
	}
}

describe('Transformer', () => {
	it('Feed single', () => {
		let fn = jest.fn();
		let fnSuccess = jest.fn();
		let c: ConsumeFunction<string> = (n) => {
			fn(n);
			return Promise.resolve();
		};
		const t = new Transformer((i: number) => (255 - i).toString(16));
		t.feeds(c);
		new SimpleFeeder(1, fnSuccess).feeds(t);

		return setTimeout(20)
			.then(() => {
				expect(fn).toBeCalledTimes(1);
				expect(fn).toHaveBeenNthCalledWith(1, "fe");
				expect(fnSuccess).toBeCalledTimes(1);
			});
	});

	it('Feed array', () => {
		let fn = jest.fn();
		let c: ConsumeFunction<string> = (n) => {
			fn(n);
			return Promise.resolve();
		};
		const t = new Transformer((i: number) => (255 - i).toString(16));
		t.feeds(c);
		new SimpleFeeder([1, 2]).feeds(t);

		return setTimeout(20)
			.then(() => {
				expect(fn).toBeCalledTimes(1);
				expect(fn).toHaveBeenNthCalledWith(1, ["fe", "fd"]);
			});
	});

	it('Relay consumer reject', () => {
		let fnSuccess = jest.fn();
		let fnFail = jest.fn();
		let c: ConsumeFunction<string> = (n) => {
			return Promise.reject(n);
		};

		const t = new Transformer((i: number) => (255 - i).toString(16));
		t.feeds(c);
		new SimpleFeeder(1, fnSuccess, fnFail).feeds(t);

		return setTimeout(20)
			.then(() => {
				expect(fnFail).toBeCalledTimes(1);
				expect(fnSuccess).toBeCalledTimes(0);
			});
	});

	it('Feed to dangling transformer', () => {
		let fnSuccess = jest.fn();
		let fnFail = jest.fn();

		const t = new Transformer((i: number) => (255 - i).toString(16));
		new SimpleFeeder(1, fnSuccess, fnFail).feeds(t);

		return setTimeout(20)
			.then(() => {
				expect(fnFail).toBeCalledTimes(1);
				expect(fnSuccess).toBeCalledTimes(0);
			});
	});

	it('Feed to disabled transformer', () => {
		let fnSuccess = jest.fn();
		let fnFail = jest.fn();
		let c: ConsumeFunction<string> = (n) => {
			return Promise.reject(n);
		};

		const t = new Transformer((i: number) => (255 - i).toString(16));
		t.feeds(c).enabled = false;
		new SimpleFeeder(1, fnSuccess, fnFail).feeds(t);

		return setTimeout(20)
			.then(() => {
				expect(fnFail).toBeCalledTimes(1);
				expect(fnSuccess).toBeCalledTimes(0);
			});
	});
});
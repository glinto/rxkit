import { setTimeout } from "timers/promises";
import { ConsumeFunction, Feeder, Filter, PushStream } from "../src";

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

describe('Filter', () => {
	it('Feed', () => {
		const fn = jest.fn();

		const t = new Filter<number>(x => x % 3 === 0);
		t.feeds((n) => {
			fn(n);
			return Promise.resolve();
		});

		new SimpleFeeder([1, 2, 3, 4, 5, 6, 11, 15, 16]).feeds(t);
		new SimpleFeeder(19).feeds(t);
		new SimpleFeeder(18).feeds(t);

		return setTimeout(20)
			.then(() => {
				expect(fn).toBeCalledTimes(2);
				expect(fn).toHaveBeenNthCalledWith(1, [3, 6, 15]);
				expect(fn).toHaveBeenNthCalledWith(2, 18);
			});
	});

});
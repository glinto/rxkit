import { setTimeout } from "timers/promises";
import { ConsumeFunction, IntervalFeeder } from "../src";

describe('IntervalFeeder', () => {

	it('Feed with options', () => {
		let fn = jest.fn();
		let c: ConsumeFunction<number> = (n) => {
			fn(n);
			return Promise.resolve();
		};
		const f = new IntervalFeeder({ interval: 40, start: 100, increment: 7 });
		f.feeds(c);

		return setTimeout(20)
			.then(() => {
				// We must not see any feeds yet
				expect(fn).toBeCalledTimes(0);
			})
			.then(() => setTimeout(120))
			.then(() => {
				f.stop();
				// Here we must see 3 feeds
				expect(fn).toBeCalledTimes(3);
				expect(fn).toHaveBeenNthCalledWith(1, 100);
				expect(fn).toHaveBeenNthCalledWith(2, 107);
				expect(fn).toHaveBeenNthCalledWith(3, 114);
			});
	});

	it('Stop before feed', () => {
		let fn = jest.fn();
		let c: ConsumeFunction<number> = (n) => {
			fn(n);
			return Promise.resolve();
		};
		const f = new IntervalFeeder();
		f.feeds(c);

		// By default feeders feed at 1000ms intervals, if we stop shortly we must ot see any feeds
		return setTimeout(10)
			.then(() => {
				f.stop();
				expect(fn).toBeCalledTimes(0);
			});
	});

	it('Disable stream', () => {
		let fn = jest.fn();
		let c: ConsumeFunction<number> = (n) => {
			fn(n);
			return Promise.resolve();
		};
		const f = new IntervalFeeder({ interval: 20 });
		let s = f.feeds(c);

		return setTimeout(30)
			.then(() => {
				expect(fn).toBeCalledTimes(1);
				s.enabled = false;
			})
			.then(() => setTimeout(30))
			.then(() => {
				// Stream disabled, we must not see more feeds
				expect(fn).toBeCalledTimes(1);
				s.enabled = true;
			})
			.then(() => setTimeout(20))
			.then(() => {
				// Stream enabled again, we must see more feeds
				expect(fn).toBeCalledTimes(2);
				f.stop();
			});
	});

	it('Discard unsuccessful feed', () => {
		let fn = jest.fn();
		let c: ConsumeFunction<number> = (n) => {
			fn(n);
			if (n !== 14) return Promise.resolve();
			return Promise.reject(13);
		};
		const f = new IntervalFeeder({ interval: 20, start: 13 });
		f.feeds(c);

		return setTimeout(70)
			.then(() => {
				f.stop();
				expect(fn).toBeCalledTimes(3);
				expect(fn).toHaveBeenNthCalledWith(1, 13);
				expect(fn).toHaveBeenNthCalledWith(2, 14);
				expect(fn).toHaveBeenNthCalledWith(3, 15);
			});
	});
});
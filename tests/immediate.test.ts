import { ConsumeFunction, ImmediateFeeder } from "../src";
import { immediatePromise } from "./test.common";

describe('ImmediateFeeder', () => {

	it('Feed', () => {
		let fn = jest.fn();
		let c: ConsumeFunction<number> = (n) => {
			fn(n);
			return Promise.resolve();
		};
		const iter = [1, 2];
		const f = new ImmediateFeeder(iter);
		f.feeds(c);

		// Must not be called yet
		expect(fn).toBeCalledTimes(0);

		return immediatePromise()
			.then(() => {
				expect(fn).toBeCalledTimes(1);
				expect(fn).toHaveBeenNthCalledWith(1, [1, 2]);
			});
	});

	it('Reject', () => {
		let fn = jest.fn();

		let c: ConsumeFunction<number> = (n) => {
			if (n === 1) return Promise.reject(n);
			fn(n);
			return Promise.resolve();
		};

		// Will be discarded
		new ImmediateFeeder(1).feeds(c);
		new ImmediateFeeder(13).feeds(c);

		return immediatePromise()
			.then(() => {
				expect(fn).toBeCalledTimes(1);
				expect(fn).toHaveBeenLastCalledWith(13);
			});
	});

});
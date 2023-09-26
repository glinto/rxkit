import { ConsumeFunction, ImmediateFeeder } from "../src";

function immediatePromsise() {
	return new Promise<void>(r => {
		setImmediate(() => r())
	});
}

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

		return immediatePromsise()
			.then(() => {
				expect(fn).toBeCalledTimes(1);
				expect(fn).toHaveBeenNthCalledWith(1, [1, 2]);
			});
	});
});
import { setTimeout } from "timers/promises";
import { ConsumeFunction, ImmediateFeeder, Watchdog } from "../src";


describe('Watchdog', () => {

	it('Feed', () => {
		let fn = jest.fn();
		let c: ConsumeFunction<number> = (n) => {
			fn(n);
			return Promise.resolve();
		};
		let stream = new Watchdog(50, 13).feeds(c);

		// Must not be called yet
		expect(fn).toBeCalledTimes(0);

		return setTimeout(10)
			.then(() => {
				expect(fn).toBeCalledTimes(0);
			})
			.then(() => setTimeout(50))
			.then(() => {
				expect(fn).toBeCalledTimes(1);
				expect(fn).toHaveBeenNthCalledWith(1, 13);
				expect(stream.enabled).toBe(false);
			})
			.then(() => setTimeout(55))
			.then(() => {
				//Must not be called again
				expect(fn).toBeCalledTimes(1);
				expect(stream.enabled).toBe(false);
			});
	});

	it('Reset trigger', () => {
		let fn = jest.fn();
		let c: ConsumeFunction<number> = (n) => {
			fn(n);
			return Promise.resolve();
		};
		let w = new Watchdog(50, 13);
		let stream = w.feeds(c);

		// Must not be called yet
		expect(fn).toBeCalledTimes(0);

		return setTimeout(25)
			.then(() => {
				expect(fn).toBeCalledTimes(0);
				// Reset the watchdog
				new ImmediateFeeder(0).triggers(stream);
			})
			.then(() => setTimeout(40))
			.then(() => {
				// Must not be called yet, because the watchdog was reset and needs 50ms again
				expect(fn).toBeCalledTimes(0);
				expect(stream.enabled).toBe(true);
			})
			.then(() => setTimeout(15))
			.then(() => {
				// Must be called now
				expect(fn).toBeCalledTimes(1);
				expect(stream.enabled).toBe(false);
				// Re-enable the watchdog
				stream.enabled = true;
			})
			.then(() => setTimeout(55))
			.then(() => {
				// Must be called again
				expect(fn).toBeCalledTimes(2);
				expect(stream.enabled).toBe(false);
			});
	});
});
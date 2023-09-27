import { ConsumeFunction, ImmediateFeeder, Watchdog } from "../src";

function mockTimeout(ms: number): Promise<void> {
	const p = new Promise<void>((r) => {
		setTimeout(() => r(), ms);
	});
	jest.advanceTimersByTime(ms);
	return p;
}

describe('Watchdog', () => {

	it('Feed', () => {
		jest.useFakeTimers();
		let fn = jest.fn();
		let c: ConsumeFunction<number> = (n) => {
			fn(n);
			return Promise.resolve();
		};
		let stream = new Watchdog(50, 13).feeds(c);

		// Must not be called yet
		expect(fn).toBeCalledTimes(0);

		return mockTimeout(10)
			.then(() => {
				expect(fn).toBeCalledTimes(0);
			})
			.then(() => mockTimeout(50))
			.then(() => {
				expect(fn).toBeCalledTimes(1);
				expect(fn).toHaveBeenNthCalledWith(1, 13);
				expect(stream.enabled).toBe(false);
			})
			.then(() => mockTimeout(55))
			.then(() => {
				//Must not be called again
				expect(fn).toBeCalledTimes(1);
				expect(stream.enabled).toBe(false);
				jest.useRealTimers();
			});
	});

	it('Reset trigger', () => {
		jest.useFakeTimers();
		let fn = jest.fn();
		let c: ConsumeFunction<number> = (n) => {
			fn(n);
			return Promise.resolve();
		};
		let w = new Watchdog(50, 13);
		let stream = w.feeds(c);

		// Must not be called yet
		expect(fn).toBeCalledTimes(0);

		return mockTimeout(25)
			.then(() => {
				expect(fn).toBeCalledTimes(0);
				// Reset the watchdog
				new ImmediateFeeder(0).triggers(stream);
			})
			.then(() => mockTimeout(40))
			.then(() => {
				// Must not be called yet, because the watchdog was reset and needs 50ms again
				expect(fn).toBeCalledTimes(0);
				expect(stream.enabled).toBe(true);
			})
			.then(() => mockTimeout(15))
			.then(() => {
				// Must be called now
				expect(fn).toBeCalledTimes(1);
				expect(stream.enabled).toBe(false);
				// Re-enable the watchdog
				stream.enabled = true;
			})
			.then(() => mockTimeout(55))
			.then(() => {
				// Must be called again
				expect(fn).toBeCalledTimes(2);
				expect(stream.enabled).toBe(false);
				jest.useRealTimers();
			});
	});

	it('Defuse trigger', () => {
		jest.useFakeTimers();
		let fn = jest.fn();
		let c: ConsumeFunction<number> = (n) => {
			fn(n);
			return Promise.resolve();
		};
		let w = new Watchdog(50, 17);
		let stream = w.feeds(c);

		// Must not be called yet
		expect(fn).toBeCalledTimes(0);

		return mockTimeout(25)
			.then(() => {
				// Must not be called yet, because within the 50ms window 
				expect(fn).toBeCalledTimes(0);
				// Defuse the watchdog
				stream.enabled = false;
			})
			.then(() => mockTimeout(60))
			.then(() => {
				// Must not be called ever, because the watchdog was defused
				expect(fn).toBeCalledTimes(0);
				expect(stream.enabled).toBe(false);
				jest.useRealTimers();
			});
	});
});
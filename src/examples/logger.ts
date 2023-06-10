import { setTimeout } from "timers/promises";
import { Consumer, IntervalFeeder } from "..";

const baseTime = Date.now();

export class SlowLogger extends Consumer<number> {
	async consume(data: number | number[]): Promise<void> {
		if ((typeof data === 'number') && (data % 9) === 0)
			return Promise.reject("9!");
		await setTimeout(500);
		console.log(Date.now() - baseTime, 'Logger', data);
	}
}

console.log('Start')
// Logs the data slowly. One feed takes 500ms to process and resolve. Rejects are immediate.
const logger = new SlowLogger();
// The interval feeder wants to feed every 300 ms, but backpressuring kicks in, and 
// feed will eventually happen every 500-800 ms
const interval = new IntervalFeeder({ interval: 300 });

interval.feeds(logger).throwsTo(
	(data) => {
		console.log(Date.now() - baseTime, `Rejected ${data}`); return Promise.resolve();
	}
);
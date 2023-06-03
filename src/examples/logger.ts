import { Consumer, IntervalFeeder, Silo } from "..";

export class Logger<T> extends Consumer<T> {
	consume(data: T | T[]): Promise<void> {
		if ((typeof data === 'number') && (data % 9) === 0)
			return Promise.reject("9!");
		console.log(new Date(), 'Logger', data);
		return Promise.resolve();
	}
}

console.log('Start')
let logger = new Logger<number>();
let interval = new IntervalFeeder({ interval: 300 });
let trigger = new IntervalFeeder({ interval: 1000 });
let silo = new Silo<number>();

interval.feeds(silo);
interval.feeds(logger).throws = (data) => { console.log(new Date(), `Rejected ${data}`); return Promise.resolve(); }
let siloStream = silo.feeds(logger);
trigger.feeds(siloStream.trigger);
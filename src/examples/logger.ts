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
const logger = new Logger<number>();
const interval = new IntervalFeeder({ interval: 300 });
const trigger = new IntervalFeeder({ interval: 1000 });
const silo = new Silo<number>();

interval.feeds(silo);
interval.feeds(logger).throws = (data) => { console.log(new Date(), `Rejected ${data}`); return Promise.resolve(); }
const siloStream = silo.feeds(logger);
trigger.feeds(siloStream.trigger);
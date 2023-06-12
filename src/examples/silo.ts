import { Consumer } from "..";
import { IntervalFeeder } from "../components/interval";
import { Silo } from "../components/silo";

export class Logger<T> extends Consumer<T> {
	consume(data: T | T[]): Promise<void> {
		console.log(new Date(), 'Logger', data);
		return Promise.resolve();
	}
}

console.log('Start')
const logger = new Logger<number>();
const fastInterval = new IntervalFeeder({ interval: 300 });
const slowInterval = new IntervalFeeder({ interval: 1000 });
const silo = new Silo<number>();

// The silo is fed every 300ms
fastInterval.feeds(silo);
// The silo, when triggered, will feed the logger
const siloStream = silo.feeds(logger);
// The silo's trigger will be fed every 1000ms
slowInterval.feeds(siloStream.trigger);


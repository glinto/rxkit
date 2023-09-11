import { Consumer } from "..";
import { IntervalFeeder } from "../components/interval";
import { Silo } from "../components/silo";

export class Logger<T> extends Consumer<T> {
	consume(data: T | T[]): Promise<void> {
		console.log(new Date(), 'Logger', data);
		return Promise.resolve();
	}
}

console.log('Start');

new IntervalFeeder({ interval: 300 })
	.pipe(new Silo())
	.out(new Logger())
	.triggeredWith(new IntervalFeeder({ interval: 1000 }));

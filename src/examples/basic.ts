import { Logger, IntervalFeeder, Silo } from "..";

console.log('Start')
let logger = new Logger<number>();
let interval = new IntervalFeeder({ interval: 300 });
let trigger = new IntervalFeeder({ interval: 1000 });
let silo = new Silo<number>();

//interval.feeds(Transform.mapTo(n => ["foo", "bar"][n % 2], strlogger));
interval.feeds(silo);
interval.feeds(logger).throws = (data) => { console.log(new Date(), `Rejected ${data}`); return Promise.resolve(); }
let siloStream = silo.feeds(logger);
trigger.feeds(siloStream.trigger);
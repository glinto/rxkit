import { ConsumeFunction } from "..";
import { IteratorFeeder } from "../components/iterator";
import { Transformer } from "../components/transformer";

const consumer: ConsumeFunction<string> = (s) => {
	console.log(s);
	return Promise.resolve();
}


const transform = new Transformer((i: number) => {
	if (i % 3 === 0) return `${i} can be devided by 3`;
	return `${i} cannot be devided by 3`;
});

const iter = new Array(10).fill(0).map((_value, index) => index).values();

new IteratorFeeder(iter)
	.pipe(transform)
	.out(consumer);
import { ConsumeFunction } from "..";
import { IteratorFeeder } from "../components/iterator";
import { Transformer } from "../components/transformer";

const consumer: ConsumeFunction<string> = (s) => {
	console.log(s);
	return Promise.resolve();
}


const t = new Transformer((i: number) => {
	if (i % 3 === 0) return `${i} can be devided by 3`;
	return `${i} cannot be devided by 3`;
});
t.feeds(consumer);

const iter = new Array(10).fill(0).map((_value, index) => index).values();
const f = new IteratorFeeder(iter);
f.feeds(t);
import { setTimeout } from "timers/promises";
import { ConsumeFunction, IteratorFeeder } from "../src";

describe('IteratorFeeder', () => {

    it('Feed', () => {
        let fn = jest.fn();
        let c: ConsumeFunction<number> = (n) => {
            fn(n);
            return Promise.resolve();
        };
        const iter = [1, 2, 3].values();
        const f = new IteratorFeeder(iter);
        f.feeds(c);

        return setTimeout(20)
            .then(() => {
                expect(fn).toBeCalledTimes(3);
                expect(fn).toHaveBeenNthCalledWith(1, 1);
                expect(fn).toHaveBeenNthCalledWith(2, 2);
                expect(fn).toHaveBeenNthCalledWith(3, 3);
            });
    });
});
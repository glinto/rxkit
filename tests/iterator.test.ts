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

        return setTimeout(100)
            .then(() => {
                expect(fn).toBeCalledTimes(3);
                expect(fn).toHaveBeenNthCalledWith(1, 1);
                expect(fn).toHaveBeenNthCalledWith(2, 2);
                expect(fn).toHaveBeenNthCalledWith(3, 3);
            });
    });

    it('Discard reject', () => {
        let fn = jest.fn();
        let c: ConsumeFunction<number> = (n) => {
            if (n === 8) return Promise.reject(n);
            fn(n);
            return Promise.resolve();
        };
        const iter = [7, 8, 9].values();
        const f = new IteratorFeeder(iter);
        f.feeds(c);

        return setTimeout(20)
            .then(() => {
                expect(fn).toBeCalledTimes(2);
                expect(fn).toHaveBeenNthCalledWith(1, 7);
                expect(fn).toHaveBeenNthCalledWith(2, 9);
            });
    });

    it('Resume feed', () => {
        let fn = jest.fn();
        let c: ConsumeFunction<number> = (n) => {
            fn(n);
            return Promise.resolve();
        };
        const iter = [4, 5, 6].values();
        const f = new IteratorFeeder(iter);
        const stream = f.feeds(c);
        stream.enabled = false;

        return setTimeout(20)
            .then(() => {
                expect(fn).toBeCalledTimes(0);
                stream.enabled = true;
            })
            .then(() => setTimeout(10))
            .then(() => {
                expect(fn).toBeCalledTimes(3);
                expect(fn).toHaveBeenNthCalledWith(1, 4);
                expect(fn).toHaveBeenNthCalledWith(2, 5);
                expect(fn).toHaveBeenNthCalledWith(3, 6);
                // Stream is disabled after iterator exhausts
                expect(stream.enabled).toBe(false);
            })
    });
});
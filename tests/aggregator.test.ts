import { setTimeout } from "timers/promises";
import { ConsumeFunction, Feeder, PushStream, Aggregator } from "../src";

class SimpleFeeder extends Feeder<number> {

    constructor(private data: number | number[], private success?: jest.Mock, private failure?: jest.Mock) {
        super();
    }

    protected setupFeed(c: ConsumeFunction<number>): PushStream {
        const s = new PushStream();
        this.next(this.data, c, s)
            .then(() => {
                if (this.success !== undefined) this.success(this.data);
            })
            .catch(() => {
                if (this.failure !== undefined) this.failure(this.data);
            })
        return s;
    }
}

describe('Transformer', () => {
    it('Feed single', () => {
        let fn = jest.fn();
        let fnSuccess = jest.fn();
        let c: ConsumeFunction<number> = (n) => {
            fn(n);
            return Promise.resolve();
        };
        const t = new Aggregator<number, number>((n: number[]) => [n.length]);
        t.feeds(c);
        new SimpleFeeder(1, fnSuccess).feeds(t);

        return setTimeout(20)
            .then(() => {
                expect(fn).toBeCalledTimes(1);
                expect(fn).toHaveBeenNthCalledWith(1, [1]);
                expect(fnSuccess).toBeCalledTimes(1);
            });
    });

    it('Feed array', () => {
        let fn = jest.fn();
        let c: ConsumeFunction<number> = (n) => {
            fn(n);
            return Promise.resolve();
        };
        const t = new Aggregator<number, number>((n: number[]) => [n.reduce((prev, cur) => prev + cur)]);
        t.feeds(c);
        new SimpleFeeder([1, 2]).feeds(t);

        return setTimeout(20)
            .then(() => {
                expect(fn).toBeCalledTimes(1);
                expect(fn).toHaveBeenNthCalledWith(1, [3]);
            });
    });

    it('Feed to dangling aggregator', () => {
        let fnSuccess = jest.fn();
        let fnFail = jest.fn();

        const t = new Aggregator<number, number>((n: number[]) => [n.length]);
        new SimpleFeeder(1, fnSuccess, fnFail).feeds(t);

        return setTimeout(20)
            .then(() => {
                expect(fnFail).toBeCalledTimes(1);
                expect(fnSuccess).toBeCalledTimes(0);
            });
    });

    it('Feed to disabled aggregator', () => {
        let fnSuccess = jest.fn();
        let fnFail = jest.fn();
        let c: ConsumeFunction<number> = (n) => {
            return Promise.reject(n);
        };

        const t = new Aggregator<number, number>((n: number[]) => [n.length]);
        t.feeds(c).enabled = false;
        new SimpleFeeder(1, fnSuccess, fnFail).feeds(t);

        return setTimeout(20)
            .then(() => {
                expect(fnFail).toBeCalledTimes(1);
                expect(fnSuccess).toBeCalledTimes(0);
            });
    });

});
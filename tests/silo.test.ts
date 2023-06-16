import { setTimeout } from "timers/promises";
import { ConsumeFunction, Feeder, PushStream, Silo } from "../src";

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

describe('Silo', () => {

    it('Hold and release', () => {
        let fn = jest.fn();
        let c: ConsumeFunction<number> = (n) => {
            fn(n);
            return Promise.resolve();
        };
        const f = new SimpleFeeder([7, 8, 9]);
        const s = new Silo<number>();
        const stream = s.feeds(c);
        f.feeds(s);
        new SimpleFeeder(11).feeds(s);

        return setTimeout(20)
            .then(() => {
                // Silo must not release until trigger fed
                expect(fn).toBeCalledTimes(0);
                expect(s.store.length).toBe(4);

                new SimpleFeeder(0).triggers(stream);
            })
            .then(() => setTimeout(20))
            .then(() => {
                expect(fn).toBeCalledTimes(1);
                expect(s.store.length).toBe(0);
                expect(fn).toHaveBeenLastCalledWith([7, 8, 9, 11]);
            });
    });

    it('Keep data on failed feed', () => {
        let fn = jest.fn();
        let c: ConsumeFunction<number> = (n) => {
            fn(n);
            return Promise.reject(n);
        };
        const f = new SimpleFeeder([1, 2]);
        const s = new Silo<number>();
        const stream = s.feeds(c);
        f.feeds(s);
        new SimpleFeeder(0).triggers(stream);

        return setTimeout(20)
            .then(() => {
                // Silo attempted to release
                expect(fn).toBeCalledTimes(1);
                // Did not empty the store, becasue fed failed
                expect(s.store.length).toBe(2);
            });
    });

    it('Disable and resume', () => {
        let fn = jest.fn();
        let c: ConsumeFunction<number> = (n) => {
            fn(n);
            return Promise.resolve();
        };
        const f = new SimpleFeeder([1, 2]);
        const s = new Silo<number>();
        const stream = s.feeds(c);
        stream.enabled = false;
        f.feeds(s);
        new SimpleFeeder(0).triggers(stream);

        return setTimeout(20)
            .then(() => {
                // No release attempted on disabled stream
                expect(fn).toBeCalledTimes(0);
                // Did not empty the store
                expect(s.store.length).toBe(2);
                stream.enabled = true;
            })
            .then(() => setTimeout(20))
            .then(() => {
                // Release attempted
                expect(fn).toBeCalledTimes(1);
                // Did not empty the store
                expect(s.store.length).toBe(0);
            });
    });

    it('Dont release empty store', () => {
        let fn = jest.fn();
        let c: ConsumeFunction<number> = (n) => {
            fn(n);
            return Promise.resolve();
        };
        const f = new SimpleFeeder([]);
        const s = new Silo<number>();
        const stream = s.feeds(c);
        f.feeds(s);
        new SimpleFeeder(0).triggers(stream);

        return setTimeout(20)
            .then(() => {
                // Silo did not attempt to release
                expect(fn).toBeCalledTimes(0);
                expect(s.store.length).toBe(0);
            });
    });


});
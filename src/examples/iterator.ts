import { ConsumeFunction, IteratorFeeder } from "..";

const baseTime = Date.now();

/**
 * 80% chance to resolve slowly, 20% chance to reject immediately
 */
const consumer: ConsumeFunction<number> = (n) => {
    if (Math.random() > .2) {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(Date.now() - baseTime, n);
                resolve();
            }, 100);
        })
    }
    else {
        return Promise.reject(n);
    }
}

/**
 * Alternate consumer for redirecting errors to
 */
const consumerE: ConsumeFunction<number> = (n) => {
    console.log(Date.now() - baseTime, 'Threw', n);
    return Promise.resolve();
}

const iter = new Array(10).fill(0).map((_value, index) => index).values();
const f = new IteratorFeeder(iter);
f.feeds(consumer).throwsTo(consumerE);
export function immediatePromise(): Promise<void> {
    return new Promise<void>(r => {
        setImmediate(() => r());
    });
}


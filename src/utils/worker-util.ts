export const createWorker = async (callback: (self: WorkerGlobalScope['self']) => void, options?: WorkerOptions): Promise<Worker> => {
    const source = `postMessage(null);(${callback.toString()})(self);`;
    const blob = new Blob([source], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    const worker = new Worker(url, options);

    const value = await Promise.race([
        new Promise<true>(resolve => {
            const listener = () => {
                worker.removeEventListener('message', listener);
                resolve(true);
            };

            worker.addEventListener('message', listener);
        }),

        new Promise<ErrorEvent>(resolve => {
            const listener = (event: ErrorEvent) => {
                worker.removeEventListener('error', listener);
                resolve(event);
            };

            worker.addEventListener('error', listener)
        })
    ]);

    URL.revokeObjectURL(url);

    if (value === true) return worker;
    else throw Error(value.message);
};
export class CancelationError extends Error {
  readonly name: string = "CancelationError";

  constructor(public readonly reason: any = null) {
    super(reason ? `Task canceled: ${reason}` : "Task canceled.");
  }
}

export function isCancelation(error: Error): error is CancelationError {
  return error instanceof CancelationError;
}

export type Runnable<T> = T | PromiseLike<T>;
export type TaskRunner = (<T>(runnable: Runnable<T>) => Promise<T>) & {
  linked<T>(other: Task<T>): Promise<T>;
};
export type TaskFunction<T> = (run: TaskRunner) => Promise<T>;

function runner(task: Task<any>): TaskRunner {
  type PartialTaskRunner = (<T>(runnable: Runnable<T>) => Promise<T>) & {
    linked?<T>(other: Task<T>): Promise<T>;
  };

  const run: PartialTaskRunner = async <T>(
    runnable: Runnable<T>
  ): Promise<T> => {
    task.abortIfCanceled();
    const result = await Promise.resolve(runnable);
    task.abortIfCanceled();
    return result;
  };

  run.linked = (other: Task<any>) => run(other.link(task));

  return run as TaskRunner;
}

enum Completion {
  Running,
  Success,
  Error,
  Cancel,
}

function NOOP() {
  /* no-op */
}

const UNINITIALIZED = {};

// TODO: should Task subclass Promise?
export class Task<T> implements Promise<T> {
  // FIXME: this is required by the TS Promise interface
  readonly [Symbol.toStringTag]: "Promise";

  private _state = Completion.Running;
  private _linked: Set<Task<any>> | null = null;
  private _promise: Promise<T>;
  private _cancel: (reason: any) => void = NOOP;
  private _result: any = UNINITIALIZED;

  constructor(func: TaskFunction<T>) {
    this._promise = new Promise((_resolve, _reject) => {
      let resolve = (value: T) => {
        this._state = Completion.Success;
        this._result = value;

        resolve = reject = cancel = this._cancel = NOOP;

        _resolve(value);
      };

      let reject = (error: any) => {
        this._state = Completion.Error;
        this._result = error;

        resolve = reject = cancel = this._cancel = NOOP;

        _reject(error);
      };

      let cancel = (this._cancel = (reason: any) => {
        this._state = Completion.Cancel;
        this._result = reason;

        resolve = reject = cancel = this._cancel = NOOP;

        _reject(new CancelationError(reason));
      });

      const run = async () => {
        try {
          const value = await func(runner(this));
          this.abortIfCanceled();
          resolve(value);
        } catch (error) {
          if (isCancelation(error)) {
            cancel(error.reason);
          } else {
            reject(error);
          }
        }
      };

      run();
    });
  }

  get isRunning(): boolean {
    return this._syncState() === Completion.Running;
  }

  get isDone(): boolean {
    return !this.isRunning;
  }

  get isSuccessful(): boolean {
    return this._syncState() === Completion.Success;
  }

  get isError(): boolean {
    return this._syncState() === Completion.Error;
  }

  get isCanceled(): boolean {
    return this._syncState() === Completion.Cancel;
  }

  get value(): T {
    if (!this.isDone) {
      throw new Error("The task is still running.");
    }
    if (!this.isSuccessful) {
      throw new Error("The task did not complete successfully.");
    }

    return this._result;
  }

  get error(): any {
    if (!this.isDone) {
      throw new Error("The task is still running.");
    }
    if (!this.isError) {
      throw new Error("The task did not error.");
    }

    return this._result;
  }

  get reason(): any {
    if (!this.isDone) {
      throw new Error("The task is still running.");
    }
    if (!this.isCanceled) {
      throw new Error("The task was not canceled.");
    }

    return this._result;
  }

  link<U>(other: Task<U>): Task<U> {
    if (this.isRunning) {
      this._linked = this._linked || new Set();
      this._linked.add(other);
    }

    return other;
  }

  abortIfCanceled(): void {
    if (this.isCanceled) {
      throw new CancelationError(this.reason);
    }
  }

  cancel(reason: any = null): void {
    this._cancel(reason);
  }

  /* Delegates promise methods to the internal promise – copied from lib.es5.d.ts */

  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onfulfilled, onrejected);
  }

  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): Promise<T | TResult> {
    return this._promise.catch(onrejected);
  }

  /**
   * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected).
   * The resolved value cannot be modified from the callback.
   * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
   * @returns A Promise for the completion of the callback.
   */
  finally<TResult = never>(
    onfinally?: (() => void) | null | undefined
  ): Promise<T | TResult> {
    return this._promise.finally(onfinally);
  }

  private _syncState(): Completion {
    const { _result: result, _linked: linked } = this;

    if (result === UNINITIALIZED && linked !== null) {
      for (const task of linked) {
        if (task.isCanceled) {
          this.cancel(
            task.reason
              ? `Canceled by a linked task: ${task.reason}`
              : "Canceled by a linked task"
          );
          break;
        }
      }
    }

    return this._state;
  }
}

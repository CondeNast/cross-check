import { Task, isCancelation } from "@condenast/cross-check";

describe("Task", () => {
  test("Running a basic task", async () => {
    let step = 0;

    const task = new Task(async () => {
      expect(++step).toBe(1);
      return "it works";
    });

    expect(step).toBe(1);

    expect(getState(task)).toEqual({
      isRunning: true,
      isDone: false,
      isSuccessful: false,
      isError: false,
      isCanceled: false,
    });

    const value = await task;

    expect(step).toBe(1);

    expect(getState(task)).toEqual({
      isRunning: false,
      isDone: true,
      isSuccessful: true,
      isError: false,
      isCanceled: false,
    });

    expect(value).toEqual("it works");
    expect(task.value).toEqual("it works");
    expect(() => task.error).toThrow();
    expect(() => task.reason).toThrow();
  });

  test("Running a basic task that throws", async () => {
    let step = 0;

    const task = new Task(async () => {
      expect(++step).toBe(1);
      throw new Error("zomg");
    });

    expect(step).toBe(1);

    expect(getState(task)).toEqual({
      isRunning: true,
      isDone: false,
      isSuccessful: false,
      isError: false,
      isCanceled: false,
    });

    try {
      await task;
      expect(false).toBeTruthy();
    } catch (error) {
      expect(step).toBe(1);

      expect(getState(task)).toEqual({
        isRunning: false,
        isDone: true,
        isSuccessful: false,
        isError: true,
        isCanceled: false,
      });

      expect(isCancelation(error)).not.toBeTruthy();
      expect(error.message).toBe("zomg");
      expect(task.error.message).toBe("zomg");
      expect(() => task.value).toThrow();
      expect(() => task.reason).toThrow();
    }
  });

  test("Can await other runnables", async () => {
    const task = new Task(async (run) => {
      expect(await run("hello")).toBe("hello");

      expect(await run(Promise.resolve("world"))).toBe("world");

      return run("bye!");
    });

    expect(await task).toBe("bye!");
  });

  test("Can cancel immediately", async () => {
    let step = 0;

    const task = new Task(async () => {
      expect(++step).toBe(1);
    });

    expect(step).toBe(1);

    expect(getState(task)).toEqual({
      isRunning: true,
      isDone: false,
      isSuccessful: false,
      isError: false,
      isCanceled: false,
    });

    task.cancel("because reason");

    expect(getState(task)).toEqual({
      isRunning: false,
      isDone: true,
      isSuccessful: false,
      isError: false,
      isCanceled: true,
    });

    try {
      await task;
      expect(false).toBeTruthy();
    } catch (error) {
      expect(step).toBe(1);

      expect(getState(task)).toEqual({
        isRunning: false,
        isDone: true,
        isSuccessful: false,
        isError: false,
        isCanceled: true,
      });

      expect(isCancelation(error)).toBeTruthy();
      expect(error.message).toBe("Task canceled: because reason");
      expect(error.reason).toBe("because reason");
      expect(() => task.value).toThrow();
      expect(() => task.error).toThrow();
    }
  });

  test("Can cancel after making some progress", async () => {
    let step = 0;
    const taskBarrier = new Semaphore();
    const testBarrier = new Semaphore();

    const task = new Task(async (run) => {
      expect(++step).toBe(1);

      await taskBarrier.wait();

      expect(++step).toBe(2);

      testBarrier.signal();

      await run(null);

      expect(false).toBeTruthy();
    });

    expect(step).toBe(1);

    expect(getState(task)).toEqual({
      isRunning: true,
      isDone: false,
      isSuccessful: false,
      isError: false,
      isCanceled: false,
    });

    task.cancel();

    expect(getState(task)).toEqual({
      isRunning: false,
      isDone: true,
      isSuccessful: false,
      isError: false,
      isCanceled: true,
    });

    taskBarrier.signal();
    await testBarrier.wait();

    expect(step).toBe(2);

    expect(getState(task)).toEqual({
      isRunning: false,
      isDone: true,
      isSuccessful: false,
      isError: false,
      isCanceled: true,
    });

    try {
      await task;
      expect(false).toBeTruthy();
    } catch (error) {
      expect(step).toBe(2);

      expect(getState(task)).toEqual({
        isRunning: false,
        isDone: true,
        isSuccessful: false,
        isError: false,
        isCanceled: true,
      });

      expect(isCancelation(error)).toBeTruthy();
      expect(error.message).toBe("Task canceled.");
      expect(error.reason).toStrictEqual(null);
      expect(task.reason).toStrictEqual(null);
      expect(() => task.value).toThrow();
      expect(() => task.error).toThrow();
    }
  });

  test("Can link tasks", async () => {
    const a = new Task(async (run) => {
      await run(null);
      expect(false).toBeTruthy();
    });

    const b = new Task(async (run) => {
      await run(null);
      expect(false).toBeTruthy();
    });

    const c = new Task(async (run) => {
      await run(null);
      return "c";
    });

    b.link(a);

    expect(getState(a)).toEqual({
      isRunning: true,
      isDone: false,
      isSuccessful: false,
      isError: false,
      isCanceled: false,
    });

    expect(getState(b)).toEqual({
      isRunning: true,
      isDone: false,
      isSuccessful: false,
      isError: false,
      isCanceled: false,
    });

    expect(getState(c)).toEqual({
      isRunning: true,
      isDone: false,
      isSuccessful: false,
      isError: false,
      isCanceled: false,
    });

    a.cancel();

    expect(getState(a)).toEqual({
      isRunning: false,
      isDone: true,
      isSuccessful: false,
      isError: false,
      isCanceled: true,
    });

    expect(getState(b)).toEqual({
      isRunning: false,
      isDone: true,
      isSuccessful: false,
      isError: false,
      isCanceled: true,
    });

    expect(getState(c)).toEqual({
      isRunning: true,
      isDone: false,
      isSuccessful: false,
      isError: false,
      isCanceled: false,
    });

    try {
      await a;
      expect(false).toBeTruthy();
    } catch (error) {
      expect(getState(a)).toEqual({
        isRunning: false,
        isDone: true,
        isSuccessful: false,
        isError: false,
        isCanceled: true,
      });
    }

    try {
      await b;
      expect(false).toBeTruthy();
    } catch (error) {
      expect(getState(a)).toEqual({
        isRunning: false,
        isDone: true,
        isSuccessful: false,
        isError: false,
        isCanceled: true,
      });
    }

    expect(await c).toBe("c");

    expect(getState(c)).toEqual({
      isRunning: false,
      isDone: true,
      isSuccessful: true,
      isError: false,
      isCanceled: false,
    });
  });

  test("Can link tasks via run.linked", async () => {
    let step = 0;
    const taskBarrier = new Semaphore();

    // These should be synchronously assigned below.
    // This is a hack to get TS to believe it.
    let childLinked: Task<void> = null as any;
    let childUnlinked: Task<string> = null as any;

    const parent = new Task(async (run) => {
      expect(++step).toBe(1);

      childLinked = new Task(async (runInner) => {
        expect(++step).toBe(2);
        await runInner(taskBarrier.wait());
        expect(false).toBeTruthy();
      });

      childUnlinked = new Task(async (runInner) => {
        expect(++step).toBe(3);
        await runInner(taskBarrier.wait());
        expect(++step).toBe(4);
        return "childUnlinked";
      });

      await Promise.all([
        run.linked(childLinked),
        run(childUnlinked), // unlinked
      ]);

      expect(false).toBeTruthy();
    });

    expect(step).toBe(3);

    expect(getState(parent)).toEqual({
      isRunning: true,
      isDone: false,
      isSuccessful: false,
      isError: false,
      isCanceled: false,
    });

    expect(getState(childLinked)).toEqual({
      isRunning: true,
      isDone: false,
      isSuccessful: false,
      isError: false,
      isCanceled: false,
    });

    expect(getState(childUnlinked)).toEqual({
      isRunning: true,
      isDone: false,
      isSuccessful: false,
      isError: false,
      isCanceled: false,
    });

    parent.cancel();

    expect(getState(parent)).toEqual({
      isRunning: false,
      isDone: true,
      isSuccessful: false,
      isError: false,
      isCanceled: true,
    });

    expect(getState(childLinked)).toEqual({
      isRunning: false,
      isDone: true,
      isSuccessful: false,
      isError: false,
      isCanceled: true,
    });

    expect(getState(childUnlinked)).toEqual({
      isRunning: true,
      isDone: false,
      isSuccessful: false,
      isError: false,
      isCanceled: false,
    });

    taskBarrier.signalAll();

    try {
      await parent;
      expect(false).toBeTruthy();
    } catch (error) {
      expect(getState(parent)).toEqual({
        isRunning: false,
        isDone: true,
        isSuccessful: false,
        isError: false,
        isCanceled: true,
      });
    }

    try {
      await childLinked;
      expect(false).toBeTruthy();
    } catch (error) {
      expect(getState(childLinked)).toEqual({
        isRunning: false,
        isDone: true,
        isSuccessful: false,
        isError: false,
        isCanceled: true,
      });
    }

    expect(await childUnlinked).toEqual("childUnlinked");

    expect(getState(childUnlinked)).toEqual({
      isRunning: false,
      isDone: true,
      isSuccessful: true,
      isError: false,
      isCanceled: false,
    });
  });

  function getState(task: Task<any>) {
    return {
      isRunning: task.isRunning,
      isDone: task.isDone,
      isSuccessful: task.isSuccessful,
      isError: task.isError,
      isCanceled: task.isCanceled,
    };
  }

  class Semaphore {
    private waiters: Array<() => void> = [];

    constructor(private value = 0) {}

    wait(): Promise<void> {
      if (--this.value >= 0) {
        return Promise.resolve();
      } else {
        return new Promise((resolve) => {
          this.waiters.push(resolve);
        });
      }
    }

    signal(): void {
      ++this.value;

      const waiter = this.waiters.pop();

      if (waiter) {
        waiter();
      }
    }

    signalAll(): void {
      this.value = 0;
      this.waiters.forEach((waiter) => waiter());
      this.waiters.length = 0;
    }
  }
});

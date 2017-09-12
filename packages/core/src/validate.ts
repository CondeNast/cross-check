import { Task } from 'no-show';
import { Environment, ValidationDescriptor, ValidationError } from './descriptor';

export function validate<T>(env: Environment, value: T, descriptor: ValidationDescriptor<T>): Task<ValidationError[]> {
  return new Task(async run => {
    let { factory, options } = descriptor;
    let validator = factory(env, options);

    return await run(validator(value));
  });
}

import { Task } from 'no-show';
import { Option } from 'ts-std';
import { Environment, ValidationDescriptor, ValidationError } from './descriptor';

export function validate<T>(env: Environment, value: T, descriptor: ValidationDescriptor<T>, context: Option<string>): Task<ValidationError[]> {
  return new Task(async run => {
    let { factory, options, contexts } = descriptor;

    if (context !== null && contexts.length) {
      if (contexts.indexOf(context) === -1) return [];
    }

    let validator = factory(env, options);

    return await run(validator(value, context));
  });
}

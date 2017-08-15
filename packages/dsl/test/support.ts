import { MultiValidationDSL, ValidationBuilderDSL, multi, validates } from '@validations/dsl';

// this namespace provides multi() versions of the key testing validators so it's easy
// to confirm that all of the functionality works with them.
//
// It probably makes sense to convert this into a class-based test harness. TODO.
export namespace Multi {
  export let presence = multi().add(validates('presence'));
  export let confirmation = multi().add(validates('confirmation'));

  export function email(tlds?: string[]) {
    let email = tlds ? validates('email', { tlds }) : validates('email');
    return present(email);
  }

  export function present(validator: ValidationBuilderDSL) {
    return multi().add(presence).add(validator);
  }
}

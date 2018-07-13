declare var QUnit: any;

export let DEBUG_LOG: string | null = null;

if (typeof QUnit !== "undefined") {
  DEBUG_LOG = QUnit.urlParams["debug-log"];
}

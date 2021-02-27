export const suiteStartEvent = () => ({cid: "0-0", title: "foo", runner: {"0-0": {}}});
export const suiteEndEvent = () => ({cid: "0-0", title: "foo"});
export const testStartEvent = () => ({type: 'test', cid: "0-0", title: "foo", runner: {"0-0": {}}});

import {
  pipe,
  fromEvent,
  fromPromise,
  filter,
  interval,
  map,
  merge,
  scan,
  forEach,
  share,
} from "callbag-basics";
import makeSubject from "callbag-subject";
import {
  LEGACY_INIT,
  WINDOW_RESIZE,
  makeApplicationSource,
} from "./callbagDuplex";
import { initialState, reducer } from "./reducer";

export function setup(legacy) {
  const applicationSubject = makeSubject();
  const applicationState = pipe(
    merge(applicationSubject, makeApplicationSource()),
    scan((state, action) => {
      const nextStateOrWithMakeSideEffect = reducer(state, action);
      if (Array.isArray(nextStateOrWithMakeSideEffect)) {
        const [nextState, makeSideEffect] = nextStateOrWithMakeSideEffect;

        makeSideEffect(applicationSubject);
        return nextState;
      } else {
        return nextStateOrWithMakeSideEffect;
      }
    }, initialState),
    share
  );
  forEach(() => {})(applicationState);

  const dispatch = actionOrType => {
    const action =
      typeof actionOrType === "symbol" ? { type: actionOrType } : actionOrType;
    applicationSubject(1, action);
  };

  dispatch({
    type: LEGACY_INIT,
    data: legacy,
  });
  dispatch(WINDOW_RESIZE);

  return {
    applicationState,
    dispatch,
  };
}

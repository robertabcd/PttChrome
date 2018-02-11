import { createSelector, createStructuredSelector } from "reselect";
import cx from "classnames";
import React from "react";
import { constElement as screenConstantElement } from "./Screen";
import { CallbagConsumer } from "./Callbag";
import {
  SHOW_CONTEXT_MENU,
  INPUT_PASTE,
  INPUT_COMPOSITION_START,
  INPUT_COMPOSITION_END,
  INPUT,
} from "./reducer";
import "./View.css";

const noop = () => {};

const invScale = it => Math.floor(1 / it * 100) / 100;

export const View = ({
  inputRef,
  fontFace,
  fontFitWindowWidth,

  inputWidth,
  inputLeft,
  inputTop,

  cursorLeft,
  cursorTop,
  cursorColor,

  screenScaleX,
  screenScaleY,
  screenChh,
  screenMainWidth,
  screenMainMarginTop,

  mainTransform,

  dispatch,
}) => (
  <React.Fragment>
    <style>
      {`
img.hyperLinkPreview {
  transform: scale(${invScale(screenScaleX)}, ${invScale(screenScaleY)});
}
#BBSWindow {
  font-family: ${fontFace};
  font-size: ${screenChh}px;
  line-height: ${screenChh}px
}
.View__Input {
  width: ${inputWidth}px;
  height: ${screenChh}px;
  font-size: ${screenChh - 4}px;
}
.View__Input--active {
  left: ${inputLeft}px;
  top: ${inputTop}px;
}
.View__Cursor {
  left: ${cursorLeft}px;
  top: ${cursorTop}px;
  color: ${cursorColor};
}
.View__Main {
  width: ${screenMainWidth}px;
  margin-top: ${screenMainMarginTop}px;
  transform: ${mainTransform};
}
.View__EasyReadingRow--last {
  width: ${screenMainWidth}px;
  transform: ${mainTransform};
  transform-origin: center ${
    mainTransform !== "none" ? /* MAGIC NUMBER */ "-1100%" : ""
  };
}
.View__EasyReadingRow--reply {
  width: ${screenMainWidth}px;
  transform: ${mainTransform};
  transform-origin: center ${
    mainTransform !== "none" ? /* MAGIC NUMBER */ "-1010%" : ""
  };
}
          `}
    </style>
    <div
      id="BBSWindow"
      align="center"
      onContextMenu={event => {
        event.stopPropagation();
        event.preventDefault();
        dispatch({
          type: SHOW_CONTEXT_MENU,
          event,
        });
      }}
    >
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        autoFocus
        className="View__Input"
        onPaste={event => {
          dispatch({
            type: INPUT_PASTE,
            event,
          });
        }}
        onCompositionStart={() => dispatch(INPUT_COMPOSITION_START)}
        onCompositionUpdate={noop}
        onCompositionEnd={() => dispatch(INPUT_COMPOSITION_END)}
        onInput={() => dispatch(INPUT)}
      />
      <div className="View__Cursor">_</div>
      <div
        className={cx("View__Main", {
          "trans-fix": fontFitWindowWidth,
        })}
      >
        {screenConstantElement}
      </div>
      <div className="View__EasyReadingRow--last">
        <span align="left">
          <span className="q0 b7">
            {"                                                       "}
          </span>
          <span className="q1 b7">(y)</span>
          <span className="q0 b7">回應</span>
          <span className="q1 b7">(X%)</span>
          <span className="q0 b7">推文</span>
          <span className="q1 b7">(←)</span>
          <span className="q0 b7">離開 </span>
        </span>
      </div>
      <div className="View__EasyReadingRow--reply">
        <span align="left" />
      </div>
    </div>
  </React.Fragment>
);

const children = createSelector(
  createStructuredSelector({
    inputRef: ({ state }) => state.inputRef,

    fontFace: ({ state }) => state.settings.fontFace || "monospace",
    fontFitWindowWidth: ({ state }) => state.settings.fontFitWindowWidth,

    inputWidth: ({ state }) => state.input.width,
    inputLeft: ({ state }) => state.input.left,
    inputTop: ({ state }) => state.input.top,

    cursorLeft: ({ state }) => state.cursor.left,
    cursorTop: ({ state }) => state.cursor.top,
    cursorColor: ({ state }) => state.cursor.color,

    screenScaleX: ({ state }) => state.screen.scaleX,
    screenScaleY: ({ state }) => state.screen.scaleY,
    screenChh: ({ state }) => state.screen.chh,
    screenMainWidth: ({ state }) => state.screen.mainWidth,
    screenMainMarginTop: ({ state }) => state.screen.mainMarginTop,

    mainTransform: ({ state }) =>
      state.screen.scaleX != 1 || state.screen.scaleY != 1
        ? //TODO: 'scaleX('+scaleX+')'; // chrome not stable support yet!
          `scale(${state.screen.scaleX},${state.screen.scaleY})`
        : "none",

    dispatch: ({ dispatch }) => dispatch,
  }),
  props => <View {...props} />
);

export const constElement = <CallbagConsumer>{children}</CallbagConsumer>;

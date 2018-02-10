import cx from "classnames";
import React from "react";
import { compose, withStateHandlers, withHandlers } from "recompose";
import {
  Modal,
  Button,
  Tab,
  Row,
  Col,
  Nav,
  NavItem,
  NavDropdown,
  MenuItem,
  Checkbox,
  SplitButton
} from "react-bootstrap";
import ColorSpan from "../Row/WordSegmentBuilder/ColorSpan";
import { i18n } from "../../js/i18n";
import "./InputHelperModal.css";

const SYMBOLS = {
  general: [
    "，",
    "、",
    "。",
    "．",
    "？",
    "！",
    "～",
    "＄",
    "％",
    "＠",
    "＆",
    "＃",
    "＊",
    "‧",
    "；",
    "︰",
    "…",
    "‥",
    "﹐",
    "﹒",
    "˙",
    "·",
    "﹔",
    "﹕",
    "‘",
    "’",
    "“",
    "”",
    "〝",
    "〞",
    "‵",
    "′",
    "〃"
  ],

  lineBorders: [
    "├",
    "─",
    "┼",
    "┴",
    "┬",
    "┤",
    "┌",
    "┐",
    "│",
    "▕",
    "└",
    "┘",
    "╭",
    "╮",
    "╰",
    "╯",
    "╔",
    "╦",
    "╗",
    "╠",
    "═",
    "╬",
    "╣",
    "╓",
    "╥",
    "╖",
    "╒",
    "╤",
    "╕",
    "║",
    "╚",
    "╩",
    "╝",
    "╟",
    "╫",
    "╢",
    "╙",
    "╨",
    "╜",
    "╞",
    "╪",
    "╡",
    "╘",
    "╧",
    "╛"
  ],

  blocks: [
    "＿",
    "ˍ",
    "▁",
    "▂",
    "▃",
    "▄",
    "▅",
    "▆",
    "▇",
    "█",
    "▏",
    "▎",
    "▍",
    "▌",
    "▋",
    "▊",
    "▉",
    "◢",
    "◣",
    "◥",
    "◤"
  ],

  lines: [
    "﹣",
    "﹦",
    "≡",
    "｜",
    "∣",
    "∥",
    "–",
    "︱",
    "—",
    "︳",
    "╴",
    "¯",
    "￣",
    "﹉",
    "﹊",
    "﹍",
    "﹎",
    "﹋",
    "﹌",
    "﹏",
    "︴",
    "∕",
    "﹨",
    "╱",
    "╲",
    "／",
    "＼"
  ],

  special: [
    "↑",
    "↓",
    "←",
    "→",
    "↖",
    "↗",
    "↙",
    "↘",
    "㊣",
    "◎",
    "○",
    "●",
    "⊕",
    "⊙",
    "△",
    "▲",
    "☆",
    "★",
    "◇",
    "Æ",
    "□",
    "■",
    "▽",
    "▼",
    "§",
    "￥",
    "〒",
    "￠",
    "￡",
    "※",
    "♀",
    "♂"
  ],

  brackets: [
    "〔",
    "〕",
    "【",
    "】",
    "《",
    "》",
    "（",
    "）",
    "｛",
    "｝",
    "﹙",
    "﹚",
    "『",
    "』",
    "﹛",
    "﹜",
    "﹝",
    "﹞",
    "＜",
    "＞",
    "﹤",
    "﹥",
    "「",
    "」",
    "︵",
    "︶",
    "︷",
    "︸",
    "︹",
    "︺",
    "︻",
    "︼",
    "︽",
    "︾",
    "〈",
    "〉",
    "︿",
    "﹀",
    "﹁",
    "﹂",
    "﹃",
    "﹄"
  ],

  greek: [
    "Α",
    "Β",
    "Γ",
    "Δ",
    "Ε",
    "Ζ",
    "Η",
    "Θ",
    "Ι",
    "Κ",
    "Λ",
    "Μ",
    "Ν",
    "Ξ",
    "Ο",
    "Π",
    "Ρ",
    "Σ",
    "Τ",
    "Υ",
    "Φ",
    "Χ",
    "Ψ",
    "Ω",
    "α",
    "β",
    "γ",
    "δ",
    "ε",
    "ζ",
    "η",
    "θ",
    "ι",
    "κ",
    "λ",
    "μ",
    "ν",
    "ξ",
    "ο",
    "π",
    "ρ",
    "σ",
    "τ",
    "υ",
    "φ",
    "χ",
    "ψ",
    "ω"
  ],

  phonetic: [
    "ㄅ",
    "ㄆ",
    "ㄇ",
    "ㄈ",
    "ㄉ",
    "ㄊ",
    "ㄋ",
    "ㄌ",
    "ㄍ",
    "ㄎ",
    "ㄏ",
    "ㄐ",
    "ㄑ",
    "ㄒ",
    "ㄓ",
    "ㄔ",
    "ㄕ",
    "ㄖ",
    "ㄗ",
    "ㄘ",
    "ㄙ",
    "ㄚ",
    "ㄛ",
    "ㄜ",
    "ㄝ",
    "ㄞ",
    "ㄟ",
    "ㄠ",
    "ㄡ",
    "ㄢ",
    "ㄣ",
    "ㄤ",
    "ㄥ",
    "ㄦ",
    "ㄧ",
    "ㄨ",
    "ㄩ",
    "˙",
    "ˊ",
    "ˇ",
    "ˋ"
  ],

  math: [
    "╳",
    "＋",
    "﹢",
    "－",
    "×",
    "÷",
    "＝",
    "≠",
    "≒",
    "∞",
    "ˇ",
    "±",
    "√",
    "⊥",
    "∠",
    "∟",
    "⊿",
    "㏒",
    "㏑",
    "∫",
    "∮",
    "∵",
    "∴",
    "≦",
    "≧",
    "∩",
    "∪"
  ],

  hiragana: [
    "あ",
    "い",
    "う",
    "え",
    "お",
    "か",
    "き",
    "く",
    "け",
    "こ",
    "さ",
    "し",
    "す",
    "せ",
    "そ",
    "た",
    "ち",
    "つ",
    "て",
    "と",
    "な",
    "に",
    "ぬ",
    "ね",
    "の",
    "は",
    "ひ",
    "ふ",
    "へ",
    "ほ",
    "ま",
    "み",
    "む",
    "め",
    "も",
    "ら",
    "り",
    "る",
    "れ",
    "ろ",
    "が",
    "ぎ",
    "ぐ",
    "げ",
    "ご",
    "ざ",
    "じ",
    "ず",
    "ぜ",
    "ぞ",
    "だ",
    "ぢ",
    "づ",
    "で",
    "ど",
    "ば",
    "び",
    "ぶ",
    "べ",
    "ぼ",
    "ぱ",
    "ぴ",
    "ぷ",
    "ぺ",
    "ぽ",
    "や",
    "ゆ",
    "よ",
    "わ",
    "ん",
    "を"
  ],

  katakana: [
    "ア",
    "イ",
    "ウ",
    "エ",
    "オ",
    "カ",
    "キ",
    "ク",
    "ケ",
    "コ",
    "サ",
    "シ",
    "ス",
    "セ",
    "ソ",
    "タ",
    "チ",
    "ツ",
    "テ",
    "ト",
    "ナ",
    "ニ",
    "ヌ",
    "ネ",
    "ノ",
    "ハ",
    "ヒ",
    "フ",
    "ヘ",
    "ホ",
    "マ",
    "ミ",
    "ム",
    "メ",
    "モ",
    "ラ",
    "リ",
    "ル",
    "レ",
    "ロ",
    "ガ",
    "ギ",
    "グ",
    "ゲ",
    "ゴ",
    "ザ",
    "ジ",
    "ズ",
    "ゼ",
    "ゾ",
    "ダ",
    "ジ",
    "ズ",
    "デ",
    "ド",
    "バ",
    "ビ",
    "ブ",
    "ベ",
    "ボ",
    "パ",
    "ピ",
    "プ",
    "ペ",
    "ポ",
    "ヤ",
    "ユ",
    "ヨ",
    "ワ",
    "ン",
    "ヲ"
  ]
};

const EMOTICONS = {
  angry: [
    "(ノ ゜Д゜)ノ ︵ ═╩════╩═",
    "╯-____-)╯~═╩════╩═~",
    "(╭∩╮\\_/╭∩╮)",
    "( ︶︿︶)_╭∩╮",
    "( ‵□′)───C＜─___-)|||",
    "(￣ε(#￣) #○=(一-一o)",
    "(o一-一)=○# (￣#)3￣)",
    "╰(‵皿′＊)╯",
    "○(#‵︿′ㄨ)○",
    "◢▆▅▄▃-崩╰(〒皿〒)╯潰-▃▄▅▆◣"
  ],

  meh: [
    "(σ′▽‵)′▽‵)σ 哈哈哈哈～你看看你",
    "( ￣ c￣)y▂ξ",
    "( ′-`)y-～",
    "′_>‵",
    "╮(′～‵〞)╭",
    '╮(﹀_﹀")╭',
    "︿(￣︶￣)︿",
    "..╮(﹋﹏﹌)╭..",
    "╮(╯_╰)╭",
    "╮(╯▽╰)/"
  ],

  sweat: [
    "(－^－)ｄ",
    "(￣￣；)",
    "(￣□￣|||)a",
    "(●；－_－)●",
    "￣▽￣||",
    "╭ ﹀◇﹀〣",
    "ˋ(′_‵||)ˊ",
    "●( ¯▽¯；●",
    "o(＞＜；)o o"
  ],

  happy: [
    "~(￣▽￣)~(＿△＿)~(￣▽￣)~(＿△＿)~(￣▽￣)~",
    "(~^O^~)",
    "(∩_∩)",
    "<(￣︶￣)>",
    "v(￣︶￣)y",
    "﹨(╯▽╰)∕",
    "\\(@^0^@)/",
    "\\(^▽^)/",
    "\\⊙▽⊙/"
  ],

  other: [
    "(．＿．?)",
    "(？o？)",
    "(‧Q‧)",
    "〒△〒",
    "m川@.川m",
    "(¯(∞)¯)",
    "(⊙o⊙)",
    "(≧<>≦)",
    "(☆_☆)",
    'o(‧"‧)o'
  ]
};

function sendColorCommand({ fg, bg, isBlink }, onCmdSend, type) {
  let lightColor = "0;";
  if (fg > 7) {
    fg %= 8;
    lightColor = "1;";
  }
  fg += 30;
  bg += 40;
  let blink = "";
  if (isBlink) {
    blink = "5;";
  }
  let cmd = "\x15[";
  if (type == "foreground") {
    cmd += lightColor + blink + fg + "m";
  } else if (type == "background") {
    cmd += bg + "m";
  } else {
    cmd += lightColor + blink + fg + ";" + bg + "m";
  }
  onCmdSend(cmd);
}

const enhance = compose(
  withStateHandlers(
    () => ({
      fg: 7,
      bg: 0,
      isBlink: false
    }),
    {
      onColorClick: () => ({ target: { dataset: { fg } } }) => ({
        fg: parseInt(fg, 10)
      }),
      onColorContextMenu: ({ bg }) => event => {
        const { target: { dataset } } = event;
        event.preventDefault();
        event.stopPropagation();
        return {
          bg: "bg" in dataset ? parseInt(dataset.bg, 10) : bg
        };
      },
      onBlinkChange: () => ({ target: { checked } }) => ({
        isBlink: checked
      }),
      onSendClick: (state, { onCmdSend }) => () =>
        sendColorCommand(state, onCmdSend),
      onSendSelect: (state, { onCmdSend }) => eventKey =>
        sendColorCommand(state, onCmdSend, eventKey),
      onSymEmoClick: (state, { onConvSend }) => ({ target: { textContent } }) =>
        onConvSend(textContent)
    }
  ),
  withHandlers({
    onMouseDown: () => ({ currentTarget: { dataset }, clientX, clientY }) => {
      dataset.dragActive = true;
      dataset.dragLastX = clientX;
      dataset.dragLastY = clientY;
    },
    onMouseMove: () => ({
      currentTarget: { dataset, style },
      clientX,
      clientY
    }) => {
      if (dataset.dragActive === "true") {
        window.getSelection().removeAllRanges();
        style.cssText += `
          top:${(parseFloat(style.top) || 0) + clientY - dataset.dragLastY}px;
          left:${(parseFloat(style.left) || 0) + clientX - dataset.dragLastX}px;
        `;
        dataset.dragLastX = clientX;
        dataset.dragLastY = clientY;
      }
    },
    onMouseUp: () => ({ currentTarget: { dataset } }) => {
      dataset.dragActive = false;
    }
  })
);

export const InputHelperModal = ({
  show,
  onReset,
  onHide,
  // from recompose
  onMouseDown,
  onMouseMove,
  onMouseUp,
  fg,
  bg,
  isBlink,
  onColorClick,
  onColorContextMenu,
  onBlinkChange,
  onSendClick,
  onSendSelect,
  onSymEmoClick
}) => (
  <Modal
    show={show}
    className="InputHelperModal__Dialog"
    onMouseDown={onMouseDown}
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
  >
    <Modal.Header closeButton onHide={onHide}>
      <Modal.Title>{i18n("inputHelperTitle")}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Tab.Container defaultActiveKey="colors">
        <Row className="clearfix">
          <Col sm={12}>
            <Nav bsStyle="tabs">
              <NavItem eventKey="colors">{i18n("colorTitle")}</NavItem>
              <NavDropdown eventKey="symbols" title={i18n("symTitle")}>
                {Object.keys(SYMBOLS).map(group => (
                  <MenuItem eventKey={`symbols.${group}`}>
                    {i18n(`symTitle_${group}`)}
                  </MenuItem>
                ))}
              </NavDropdown>
              <NavDropdown eventKey="emoticons" title={i18n("emoTitle")}>
                {Object.keys(EMOTICONS).map(group => (
                  <MenuItem eventKey={`emoticons.${group}`}>
                    {i18n(`emoTitle_${group}`)}
                  </MenuItem>
                ))}
              </NavDropdown>
            </Nav>
          </Col>
          <Col sm={12}>
            <Tab.Content animation>
              <Tab.Pane eventKey="colors">
                <Row>
                  <Col xs={12} sm={7}>
                    <ul className="InputHelperModal__ColorList">
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b0"
                        data-fg="0"
                        data-bg="0"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b1"
                        data-fg="1"
                        data-bg="1"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b2"
                        data-fg="2"
                        data-bg="2"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b3"
                        data-fg="3"
                        data-bg="3"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b4"
                        data-fg="4"
                        data-bg="4"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b5"
                        data-fg="5"
                        data-bg="5"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b6"
                        data-fg="6"
                        data-bg="6"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b7"
                        data-fg="7"
                        data-bg="7"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b8"
                        data-fg="8"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b9"
                        data-fg="9"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b10"
                        data-fg="10"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b11"
                        data-fg="11"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b12"
                        data-fg="12"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b13"
                        data-fg="13"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b14"
                        data-fg="14"
                      />
                      <li
                        onClick={onColorClick}
                        onContextMenu={onColorContextMenu}
                        className="b15"
                        data-fg="15"
                      />
                    </ul>
                  </Col>
                  <Col xs={12} sm={5}>
                    {i18n("colorHelperTooltip1")}
                    <br />
                    {i18n("colorHelperTooltip2")}
                  </Col>
                </Row>
                <div className="InputHelperModal__Preview">
                  <ColorSpan
                    className="InputHelperModal__Preview__Content"
                    colorState={{
                      fg,
                      bg,
                      blink: isBlink
                    }}
                    inner={i18n("colorHelperPreview")}
                  />
                </div>
                <Row>
                  <Col xs={4}>
                    <Checkbox checked={isBlink} onChange={onBlinkChange}>
                      {i18n("colorHelperBlink")}
                    </Checkbox>
                  </Col>
                  <Col xs={8} className="InputHelperModal__SendButtonContainer">
                    <SplitButton
                      title={i18n("colorHelperSend")}
                      onClick={onSendClick}
                    >
                      <MenuItem eventKey="foreground" onSelect={onSendSelect}>
                        {i18n("colorHelperSendMenuFore")}
                      </MenuItem>
                      <MenuItem eventKey="background" onSelect={onSendSelect}>
                        {i18n("colorHelperSendMenuBack")}
                      </MenuItem>
                      <MenuItem divider />
                      <MenuItem eventKey="reset" onSelect={onReset}>
                        {i18n("colorHelperSendMenuReset")}
                      </MenuItem>
                    </SplitButton>
                  </Col>
                </Row>
              </Tab.Pane>
              {Object.keys(SYMBOLS).map(group => (
                <Tab.Pane eventKey={`symbols.${group}`}>
                  <ul className="InputHelperModal__SymbolList">
                    {SYMBOLS[group].map((it, index) => (
                      <li key={index} onClick={onSymEmoClick}>
                        {it}
                      </li>
                    ))}
                  </ul>
                </Tab.Pane>
              ))}
              {Object.keys(EMOTICONS).map(group => (
                <Tab.Pane eventKey={`emoticons.${group}`}>
                  <ul className="InputHelperModal__EmoticonList">
                    {EMOTICONS[group].map((it, index) => (
                      <li key={index} onClick={onSymEmoClick}>
                        {it}
                      </li>
                    ))}
                  </ul>
                </Tab.Pane>
              ))}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Modal.Body>
  </Modal>
);

export default enhance(InputHelperModal);

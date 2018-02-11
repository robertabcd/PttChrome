import React from "react";
import { constElement as view } from "./View";
import { constElement as dropdownMenu } from "./ContextMenu/DropdownMenu";
import { constElement as inputHelperModal } from "./ContextMenu/InputHelperModal";
import { constElement as liveHelperModal } from "./ContextMenu/LiveHelperModal";
import { constElement as prefModal } from "./ContextMenu/PrefModal";
import { constElement as connectionModalAlert } from "./ModalAlert/ConnectionModalAlert";
import { constElement as pasteShortcutModalAlert } from "./ModalAlert/PasteShortcutModalAlert";
import { constElement as developerModeModalAlert } from "./ModalAlert/DeveloperModeModalAlert";

export const App = () => (
  <React.Fragment>
    {view}
    {dropdownMenu}
    {inputHelperModal}
    {liveHelperModal}
    {prefModal}
    {connectionModalAlert}
    {pasteShortcutModalAlert}
    {developerModeModalAlert}
  </React.Fragment>
);

export default App;

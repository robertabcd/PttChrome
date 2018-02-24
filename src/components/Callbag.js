const CallbagContext = React.createContext({
  dispatch() {},
  state: {},
});

export const CallbagConsumer = CallbagContext.Consumer;

export const CallbagProvider = CallbagContext.Provider;

import AppRouter from "./routes";
import { ConfigProvider, App as AntdApp } from "antd";
import { Provider } from "react-redux";
import { persistor, store } from "./redux/store";
import "./assets/css/style.scss";
import { PersistGate } from "redux-persist/integration/react";
import { LoadingProvider, useLoading } from "./context/LoadingContext";
import { ExportProvider } from "./context/ExportContext";
import LoadingSpinner from "./components/LoadingSpinner";
import {setupApiInterceptor} from "./utlis/apiInterceptor";
import { useEffect } from "react";

function App() {

  useEffect(() => {
    setupApiInterceptor();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <LoadingProvider>
          <ExportProvider>
            <ConfigProvider theme={{ token: { colorPrimary: "#E5E7EB" } }}>
              <AntdApp>
                <MainApp />
              </AntdApp>
            </ConfigProvider>
          </ExportProvider>
        </LoadingProvider>
      </PersistGate>
    </Provider>
  );
}

const MainApp = () => {
  const { isLoading } = useLoading();

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <AppRouter />
    </>
  );
};

export default App;

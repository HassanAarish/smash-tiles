import { HashRouter } from "react-router";
import { ErrorBoundary } from "@/components";
import Root from "@/config/routes";

function App() {
  return (
    // HashRouter works inside the Capacitor webview without server rewrites.
    <HashRouter>
      {/* Anything that throws while rendering a page (including a page chunk that failed to
          download) stops here instead of blanking the whole app. */}
      <ErrorBoundary>
        <Root />
      </ErrorBoundary>
    </HashRouter>
  );
}

export default App;

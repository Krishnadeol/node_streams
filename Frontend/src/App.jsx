import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import UploadDoc from "../pages/UploadDoc";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <UploadDoc />
    </>
  );
}

export default App;

import { useState } from "react";
import Login from "./components/Login";
import Shell from "./components/Shell";

function App(){
  const [user, setUser] = useState(null);
  if(!user) return <Login onLogin={setUser}/>;
  return <Shell user={user} onLogout={()=>setUser(null)}/>;
}

export default App;

import { Routes, Route} from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import Home from "./pages/Home";
import Application from "./pages/Application";

function App() {
  return (
    <>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/staff/create" element={<AdminDashboard />} />
        <Route path="/admin/staff" element={<AdminDashboard />} />
        <Route path="/admin/applications" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/apply" element={<Application />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}

export default App;

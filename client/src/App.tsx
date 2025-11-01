import { Routes, Route} from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import BrowseProviders from "./pages/BrowseProviders";
import Home from "./pages/Home";
import Application from "./pages/Application";
import BookingStatus from "./pages/BookingStatus";
import PatientSignUp from "./pages/PatientSignUp";

function App() {
  return (
    <>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/signup" element={<PatientSignUp />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/staff/create" element={<AdminDashboard />} />
        <Route path="/admin/staff" element={<AdminDashboard />} />
        <Route path="/admin/applications" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/browse" element={<BrowseProviders />} />
        <Route path="/apply" element={<Application />} />
        <Route path="/bookings" element={<BookingStatus />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}

export default App;

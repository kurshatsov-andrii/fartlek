import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Profile from "./pages/Profile.tsx";
import EventDetails from "./pages/EventDetails.tsx";
import Ticket from "./pages/Ticket.tsx";
import MyEvents from "./pages/MyEvents.tsx";
import Participants from "./pages/Participants.tsx";
import OrganizerDashboard from "./pages/OrganizerDashboard.tsx";
import EventAnalytics from "./pages/EventAnalytics.tsx";
import PromoCodes from "./pages/PromoCodes.tsx";
import EventEditor from "./pages/EventEditor.tsx";
import OrganizerEventCampaign from "./pages/OrganizerEventCampaign.tsx";
import PaymentSuccess from "./pages/PaymentSuccess.tsx";
import PaymentFail from "./pages/PaymentFail.tsx";
import Admin from "./pages/Admin.tsx";
import AdminCampaigns from "./pages/AdminCampaigns.tsx";
import AdminUnsubscribes from "./pages/AdminUnsubscribes.tsx";
import AdminEventCoOrganizers from "./pages/AdminEventCoOrganizers.tsx";
import CategoryPage from "./pages/CategoryPage.tsx";
import CategoriesIndex from "./pages/CategoriesIndex.tsx";
import Contacts from "./pages/Contacts.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import ClubsCatalog from "./pages/ClubsCatalog.tsx";
import ClubDetails from "./pages/ClubDetails.tsx";
import ClubEditor from "./pages/ClubEditor.tsx";
import Features from "./pages/Features.tsx";
import Survey from "./pages/Survey.tsx";
import AdminSurvey from "./pages/AdminSurvey.tsx";
import CalendarPage from "./pages/Calendar.tsx";
import { ProfileCompletionGate } from "./components/ProfileCompletionGate";
import { AdminOnlinePresence } from "./components/AdminOnlinePresence";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ProfileCompletionGate />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-events" element={<MyEvents />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/category" element={<CategoriesIndex />} />
              <Route path="/category/:category" element={<CategoryPage />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/events/:id/participants" element={<Participants />} />
              <Route path="/ticket/:id" element={<Ticket />} />
              <Route path="/organizer" element={<OrganizerDashboard />} />
              <Route path="/organizer/events/new" element={<EventEditor />} />
              <Route path="/organizer/events/:id/analytics" element={<EventAnalytics />} />
              <Route path="/organizer/events/:id/promo-codes" element={<PromoCodes />} />
              <Route path="/organizer/events/:id/campaign" element={<OrganizerEventCampaign />} />
              <Route path="/organizer/events/:id" element={<EventEditor />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/fail" element={<PaymentFail />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/campaigns" element={<AdminCampaigns />} />
              <Route path="/admin/unsubscribes" element={<AdminUnsubscribes />} />
              <Route path="/admin/events/:id/co-organizers" element={<AdminEventCoOrganizers />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/clubs" element={<ClubsCatalog />} />
              <Route path="/clubs/edit" element={<ClubEditor />} />
              <Route path="/clubs/:slug" element={<ClubDetails />} />
              <Route path="/features" element={<Features />} />
              <Route path="/survey" element={<Survey />} />
              <Route path="/admin/survey" element={<AdminSurvey />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;

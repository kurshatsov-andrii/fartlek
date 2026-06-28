import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams } from "react-router-dom";

const EventSingularRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/events/${id}`} replace />;
};
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
import EventChangesAdmin from "./pages/EventChangesAdmin.tsx";
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
import OrganizersCatalog from "./pages/OrganizersCatalog.tsx";
import OrganizerProfileEditor from "./pages/OrganizerProfileEditor.tsx";
import OrganizerProfileDetails from "./pages/OrganizerProfileDetails.tsx";
import Features from "./pages/Features.tsx";
import Survey from "./pages/Survey.tsx";
import Testimonials from "./pages/Testimonials.tsx";
import AdminSurvey from "./pages/AdminSurvey.tsx";
import AdminSessions from "./pages/AdminSessions.tsx";
import AdminSeo from "./pages/AdminSeo.tsx";
import AdminCarousel from "./pages/AdminCarousel.tsx";
import { AdminSeoEditor } from "./components/AdminSeoEditor";
import CalendarPage from "./pages/Calendar.tsx";
import StravaCallback from "./pages/StravaCallback.tsx";
import Privacy from "./pages/Privacy.tsx";
import PublicOffer from "./pages/PublicOffer.tsx";
import UserAgreement from "./pages/UserAgreement.tsx";
import Starts from "./pages/Starts.tsx";
import StartDetails from "./pages/StartDetails.tsx";
import AdminStarts from "./pages/AdminStarts.tsx";
import { ProfileCompletionGate } from "./components/ProfileCompletionGate";
import { AdminOnlinePresence } from "./components/AdminOnlinePresence";
import { SessionTracker } from "./components/SessionTracker";

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
            <AdminOnlinePresence />
            <SessionTracker />
            <AdminSeoEditor />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-events" element={<MyEvents />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/category" element={<CategoriesIndex />} />
              <Route path="/category/:category" element={<CategoryPage />} />
              <Route path="/starts" element={<Starts />} />
              <Route path="/starts/:slug" element={<StartDetails />} />
              <Route path="/admin/starts" element={<AdminStarts />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/event/:id" element={<EventSingularRedirect />} />
              <Route path="/events/:id/participants" element={<Participants />} />
              <Route path="/ticket/:id" element={<Ticket />} />
              <Route path="/organizer" element={<OrganizerDashboard />} />
              <Route path="/organizer/events/new" element={<EventEditor />} />
              <Route path="/organizer/events/:id/analytics" element={<EventAnalytics />} />
              <Route path="/organizer/events/:id/changes" element={<EventChangesAdmin />} />
              <Route path="/organizer/events/:id/promo-codes" element={<PromoCodes />} />
              <Route path="/organizer/events/:id/campaign" element={<OrganizerEventCampaign />} />
              <Route path="/organizer/events/:id" element={<EventEditor />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment/fail" element={<PaymentFail />} />
              <Route path="/payment-fail" element={<PaymentFail />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/campaigns" element={<AdminCampaigns />} />
              <Route path="/admin/unsubscribes" element={<AdminUnsubscribes />} />
              <Route path="/admin/events/:id/co-organizers" element={<AdminEventCoOrganizers />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/clubs" element={<ClubsCatalog />} />
              <Route path="/clubs/edit" element={<ClubEditor />} />
              <Route path="/clubs/:slug" element={<ClubDetails />} />
              <Route path="/organizers" element={<OrganizersCatalog />} />
              <Route path="/organizers/edit" element={<OrganizerProfileEditor />} />
              <Route path="/organizers/:slug" element={<OrganizerProfileDetails />} />
              <Route path="/features" element={<Features />} />
              <Route path="/survey" element={<Survey />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/admin/survey" element={<AdminSurvey />} />
              <Route path="/admin/sessions" element={<AdminSessions />} />
              <Route path="/admin/seo" element={<AdminSeo />} />
              <Route path="/admin/carousel" element={<AdminCarousel />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/public-offer" element={<PublicOffer />} />
              <Route path="/user-agreement" element={<UserAgreement />} />
              <Route path="/strava/callback" element={<StravaCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;

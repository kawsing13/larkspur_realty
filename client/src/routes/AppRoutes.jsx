import { Routes, Route } from 'react-router-dom';
import {
  SquaresFour,
  ClipboardText,
  Buildings,
  AddressBook,
  CalendarBlank,
  UserCircle,
  UsersThree,
  ChartBar,
  Users,
  ClockCounterClockwise,
} from '@phosphor-icons/react';
import { PublicLayout } from '../components/layout/PublicLayout.jsx';
import { PortalLayout } from '../components/layout/PortalLayout.jsx';
import { ProtectedRoute } from '../components/layout/ProtectedRoute.jsx';

import HomePage from '../pages/public/HomePage.jsx';
import SearchPage from '../pages/public/SearchPage.jsx';
import PropertyDetailPage from '../pages/public/PropertyDetailPage.jsx';
import AgentPage from '../pages/public/AgentPage.jsx';
import FavoritesPage from '../pages/public/FavoritesPage.jsx';
import MyInquiriesPage from '../pages/public/MyInquiriesPage.jsx';
import MyViewingsPage from '../pages/public/MyViewingsPage.jsx';
import SavedSearchesPage from '../pages/public/SavedSearchesPage.jsx';
import LoginPage from '../pages/public/LoginPage.jsx';
import RegisterPage from '../pages/public/RegisterPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

import AgentDashboard from '../pages/agent/AgentDashboard.jsx';
import AgentProfilePage from '../pages/agent/AgentProfilePage.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import UsersPage from '../pages/admin/UsersPage.jsx';
import ReviewQueuePage from '../pages/admin/ReviewQueuePage.jsx';
import AgentsPage from '../pages/admin/AgentsPage.jsx';
import AgentDetailPage from '../pages/admin/AgentDetailPage.jsx';
import ReportsPage from '../pages/admin/ReportsPage.jsx';
import AuditLogPage from '../pages/admin/AuditLogPage.jsx';
import { PropertiesListPage } from '../pages/portal/PropertiesListPage.jsx';
import PropertyEditorPage from '../pages/portal/PropertyEditorPage.jsx';
import { LeadsListPage } from '../pages/portal/LeadsListPage.jsx';
import LeadDetailPage from '../pages/portal/LeadDetailPage.jsx';
import { AppointmentsListPage } from '../pages/portal/AppointmentsListPage.jsx';
import AppointmentDetailPage from '../pages/portal/AppointmentDetailPage.jsx';

// `icon` is a Phosphor component; PortalLayout renders it before the label.
const AGENT_NAV = [
  { to: '/agent', label: 'Overview', icon: SquaresFour, end: true },
  { to: '/agent/properties', label: 'Properties', icon: Buildings },
  { to: '/agent/leads', label: 'Leads', icon: AddressBook },
  { to: '/agent/appointments', label: 'Viewings', icon: CalendarBlank },
  { to: '/agent/profile', label: 'Profile', icon: UserCircle },
];
const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: SquaresFour, end: true },
  { to: '/admin/review', label: 'Review', icon: ClipboardText },
  { to: '/admin/properties', label: 'Properties', icon: Buildings },
  { to: '/admin/leads', label: 'Leads', icon: AddressBook },
  { to: '/admin/appointments', label: 'Viewings', icon: CalendarBlank },
  { to: '/admin/agents', label: 'Agents', icon: UsersThree },
  { to: '/admin/reports', label: 'Reports', icon: ChartBar },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/audit', label: 'Activity', icon: ClockCounterClockwise },
];

const STAFF_ROLES = ['AGENT', 'PROPERTY_MANAGER', 'ADMINISTRATOR', 'SUPER_ADMIN'];
const ADMIN_ROLES = ['ADMINISTRATOR', 'SUPER_ADMIN'];

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public marketplace */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="listings/:key" element={<PropertyDetailPage />} />
        <Route path="agents/:id" element={<AgentPage />} />
        <Route
          path="favorites"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-inquiries"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <MyInquiriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-viewings"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <MyViewingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="saved-searches"
          element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <SavedSearchesPage />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Agent portal */}
      <Route
        path="agent"
        element={
          <ProtectedRoute roles={STAFF_ROLES}>
            <PortalLayout title="Agent" nav={AGENT_NAV} />
          </ProtectedRoute>
        }
      >
        <Route index element={<AgentDashboard />} />
        <Route path="properties" element={<PropertiesListPage basePath="/agent" scope="mine" />} />
        <Route path="properties/new" element={<PropertyEditorPage />} />
        <Route path="properties/:id" element={<PropertyEditorPage />} />
        <Route path="leads" element={<LeadsListPage basePath="/agent" scope="mine" />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route
          path="appointments"
          element={<AppointmentsListPage basePath="/agent" scope="mine" />}
        />
        <Route path="appointments/:id" element={<AppointmentDetailPage />} />
        <Route path="profile" element={<AgentProfilePage />} />
      </Route>

      {/* Admin portal */}
      <Route
        path="admin"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <PortalLayout title="Admin" nav={ADMIN_NAV} />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="review" element={<ReviewQueuePage />} />
        <Route path="properties" element={<PropertiesListPage basePath="/admin" />} />
        <Route path="properties/new" element={<PropertyEditorPage />} />
        <Route path="properties/:id" element={<PropertyEditorPage />} />
        <Route path="leads" element={<LeadsListPage basePath="/admin" />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="appointments" element={<AppointmentsListPage basePath="/admin" />} />
        <Route path="appointments/:id" element={<AppointmentDetailPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="agents/:id" element={<AgentDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<AuditLogPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
    </Routes>
  );
}

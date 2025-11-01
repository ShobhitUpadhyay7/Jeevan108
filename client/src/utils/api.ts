/// <reference types="vite/client" />
// Centralized API definitions

export const development = "http://localhost:7001" as const;
export const deployment = "https://api.example.com";

// Simple environment switch: set to "deployment" to use deployment base URL
export const ENVIRONMENT = "development" as string; // or "deployment"
export const API_BASE = ENVIRONMENT === "deployment" ? deployment : development;

export const API_PATHS = {
  root: "/",
  auth: {
    base: "/api/auth",
    register: "/api/auth/register",
    login: "/api/auth/login",
    me: "/api/auth/me",
  },
  staff: {
    base: "/api/staff",
    byId: (id: string | number) => `/api/staff/${id}`,
  },
  applications: {
    base: "/api/applications",
    statusById: (id: string | number) => `/api/applications/${id}/status`,
  },
  adminApplications: {
    base: "/api/admin/applications",
    byId: (id: string | number) => `/api/admin/applications/${id}`,
    approve: (id: string | number) => `/api/admin/applications/${id}/approve`,
    reject: (id: string | number) => `/api/admin/applications/${id}/reject`,
  },
  adminUsers: {
    base: "/api/admin/users",
    byRole: (role: string) => `/api/admin/users/${role}`,
    byRoleAndId: (role: string, id: string | number) => `/api/admin/users/${role}/${id}`,
  },
  payments: {
    base: "/api/payments",
    createOrder: "/api/payments/create-order",
    verify: "/api/payments/verify",
  },
  publicWorkers: {
    base: "/api/workers",
    byRole: (role: string) => `/api/workers/${role}`,
    byRoleAndId: (role: string, id: string | number) => `/api/workers/${role}/${id}`,
  },
  chatbot: {
    base: "/api/chatbot",
    chat: "/api/chatbot/chat",
    recommendWorkers: "/api/chatbot/recommend-workers",
  },
  bookings: {
    base: "/api/bookings",
    create: "/api/bookings",
    patientBookings: "/api/bookings/patient/me",
    workerBookings: "/api/bookings/worker/me",
    byId: (id: string) => `/api/bookings/${id}`,
    updateStatus: (id: string) => `/api/bookings/${id}/status`,
    cancel: (id: string) => `/api/bookings/${id}`,
    all: "/api/bookings",
  },
  reviews: {
    base: "/api/reviews",
    submit: (bookingId: string) => `/api/reviews/booking/${bookingId}`,
    getBookingReview: (bookingId: string) => `/api/reviews/booking/${bookingId}`,
    getWorkerReviews: (workerId: string) => `/api/reviews/worker/${workerId}`,
    update: (reviewId: string) => `/api/reviews/${reviewId}`,
  },
} as const;

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export const API_URLS = {
  developmentBase: development,
  deploymentBase: deployment,
  base: API_BASE,
  auth: {
    register: () => apiUrl(API_PATHS.auth.register),
    login: () => apiUrl(API_PATHS.auth.login),
    me: () => apiUrl(API_PATHS.auth.me),
  },
  staff: {
    list: () => apiUrl(API_PATHS.staff.base),
    create: () => apiUrl(API_PATHS.staff.base),
    getById: (id: string | number) => apiUrl(API_PATHS.staff.byId(id)),
    updateById: (id: string | number) => apiUrl(API_PATHS.staff.byId(id)),
    deleteById: (id: string | number) => apiUrl(API_PATHS.staff.byId(id)),
  },
  applications: {
    submit: () => apiUrl(API_PATHS.applications.base),
    statusById: (id: string | number) => apiUrl(API_PATHS.applications.statusById(id)),
  },
  adminApplications: {
    list: () => apiUrl(API_PATHS.adminApplications.base),
    getById: (id: string | number) => apiUrl(API_PATHS.adminApplications.byId(id)),
    approve: (id: string | number) => apiUrl(API_PATHS.adminApplications.approve(id)),
    reject: (id: string | number) => apiUrl(API_PATHS.adminApplications.reject(id)),
  },
  adminUsers: {
    listByRole: (role: string) => apiUrl(API_PATHS.adminUsers.byRole(role)),
    getByRoleAndId: (role: string, id: string | number) => apiUrl(API_PATHS.adminUsers.byRoleAndId(role, id)),
    updateByRoleAndId: (role: string, id: string | number) => apiUrl(API_PATHS.adminUsers.byRoleAndId(role, id)),
    deleteByRoleAndId: (role: string, id: string | number) => apiUrl(API_PATHS.adminUsers.byRoleAndId(role, id)),
  },
  payments: {
    createOrder: () => apiUrl(API_PATHS.payments.createOrder),
    verify: () => apiUrl(API_PATHS.payments.verify),
  },
  chatbot: {
    chat: () => apiUrl(API_PATHS.chatbot.chat),
    recommendWorkers: () => apiUrl(API_PATHS.chatbot.recommendWorkers),
  },
  publicWorkers: {
    listAll: () => apiUrl(API_PATHS.publicWorkers.base),
    listByRole: (role: string) => apiUrl(API_PATHS.publicWorkers.byRole(role)),
    getById: (role: string, id: string | number) => apiUrl(API_PATHS.publicWorkers.byRoleAndId(role, id)),
  },
  bookings: {
    create: () => apiUrl(API_PATHS.bookings.create),
    getPatientBookings: () => apiUrl(API_PATHS.bookings.patientBookings),
    getWorkerBookings: () => apiUrl(API_PATHS.bookings.workerBookings),
    getById: (id: string) => apiUrl(API_PATHS.bookings.byId(id)),
    updateStatus: (id: string) => apiUrl(API_PATHS.bookings.updateStatus(id)),
    cancel: (id: string) => apiUrl(API_PATHS.bookings.cancel(id)),
    getAll: () => apiUrl(API_PATHS.bookings.all),
  },
  reviews: {
    submit: (bookingId: string) => apiUrl(API_PATHS.reviews.submit(bookingId)),
    getBookingReview: (bookingId: string) => apiUrl(API_PATHS.reviews.getBookingReview(bookingId)),
    getWorkerReviews: (workerId: string) => apiUrl(API_PATHS.reviews.getWorkerReviews(workerId)),
    update: (reviewId: string) => apiUrl(API_PATHS.reviews.update(reviewId)),
  },
} as const;



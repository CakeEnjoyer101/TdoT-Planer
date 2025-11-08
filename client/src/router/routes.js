const routes = [
  {
    path: "/",
    name: "login",
    component: () => import("pages/LoginPage.vue"),
  },
  {
    path: "/main",
    name: "main",
    component: () => import("pages/MainPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/admin",
    name: "admin",
    component: () => import("pages/AdminDashboard.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/user",
    name: "user",
    component: () => import("pages/UserTasks.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;

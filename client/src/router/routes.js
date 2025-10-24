const routes = [
  // Always leave this as last one,
  // but you can also remove it
 {
    path: "/main",
    name: "main",
    component: () => import("../pages/MainPage.vue"),
  },
  {
    path: "/",
    name: "login",
    component: () => import("../pages/LoginPage.vue"),
  },
  {
    path: "/admin",
    name: "admin",
    component: () => import("../pages/AdminDashboard.vue"),
  },
  {
    path: "/user",
    name: "user",
    component: () => import("../pages/UserTasks.vue"),
  },
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;

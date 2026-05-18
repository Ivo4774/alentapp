import { createBrowserRouter } from "react-router";

import { MembersView } from "./views/Members";
import { HomeView } from "./views/Home";
import { MedicalCertificateView } from "./views/MedicalCertificate";
import { LockersView } from "./views/LockersView";
import Layout from "./Layout";

export let router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        path: "/",
        Component: HomeView,
      },
      {
        path: "/members",
        Component: MembersView,
      },
      {
        path: "/lockers",
        Component: LockersView,
      },
      {
        path: "/medical-certificates",
        Component: MedicalCertificateView,
      },
    ],
  },
]);
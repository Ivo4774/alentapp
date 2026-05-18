import { createBrowserRouter } from "react-router";

import { MembersView } from "./views/Members";
import { PaymentsView } from "./views/Payments";
import { HomeView } from "./views/Home";
import { SportsView } from "./views/Sports";
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
        path: "/payments",
        Component: PaymentsView,
      },
      {
        path: "/sports",
        Component: SportsView,
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
import { ISwitchItem } from "react-declarative";

import ErrorPage from "../pages/ErrorPage/ErrorPage";
import SetupPage from "../pages/SetupPage/SetupPage";

export const routes: ISwitchItem[] = [
  {
    path: "/",
    redirect: "/setup-page",
  },
  {
    path: "/setup-page",
    element: SetupPage,
  },
  {
    path: "/error-page",
    element: ErrorPage,
  },
];

export default routes;

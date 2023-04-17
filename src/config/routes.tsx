import { ISwitchItem } from "react-declarative";

import ErrorPage from "../pages/ErrorPage/ErrorPage";
import SetupPage from "../pages/SetupPage/SetupPage";
import MainPage from "../pages/MainPage/MainPage";

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
    path: "/main-page",
    element: MainPage,
  },
  {
    path: "/error-page",
    element: ErrorPage,
  },
];

export default routes;
